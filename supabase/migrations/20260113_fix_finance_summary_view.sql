-- Update finance_summary view to respect payment_type
-- When payment_type = 'cash': show only cash, hide trade
-- When payment_type = 'trade': show only trade, hide cash
-- When payment_type = 'mixed': show both

DROP VIEW IF EXISTS finance_summary;

CREATE VIEW finance_summary AS
SELECT 
    -- Generate valid UUID from project+model combination using MD5 hash
    md5(pm.project_id::text || pm.model_id::text)::uuid AS id,
    m.id AS model_id,
    m.full_name AS model_name,
    m.alias AS model_alias,
    p.id AS project_id,
    p.project_name,
    p.client_name,
    c.name AS registered_client_name,
    b.name AS brand_name,
    
    -- Days worked: count from project_schedule
    COALESCE(
        (SELECT COUNT(DISTINCT ps.id) 
         FROM project_schedule ps 
         LEFT JOIN model_assignments ma ON ma.schedule_id = ps.id AND ma.model_id = m.id
         WHERE ps.project_id = p.id 
           AND (ma.id IS NOT NULL OR ps.start_time <= NOW())
        ), 
        -- Fallback: count schedule entries from JSON
        COALESCE(jsonb_array_length(p.schedule), 1)
    ) AS days_worked,
    
    -- Daily Fee (Cash) - ONLY if payment_type is 'cash' or 'mixed'
    CASE 
        WHEN COALESCE(p.default_model_payment_type, 'cash') = 'trade' THEN 0
        ELSE COALESCE(pm.agreed_fee, p.default_model_fee, 0)
    END AS daily_fee,
    
    -- Total Amount (Cash) - ONLY if payment_type is 'cash' or 'mixed'
    CASE 
        WHEN COALESCE(p.default_model_payment_type, 'cash') = 'trade' THEN 0
        ELSE COALESCE(
            (SELECT COUNT(DISTINCT ps.id) FROM project_schedule ps WHERE ps.project_id = p.id),
            COALESCE(jsonb_array_length(p.schedule), 1)
        ) * COALESCE(pm.agreed_fee, p.default_model_fee, 0)
    END AS total_amount,
    
    -- Trade Fee - ONLY if payment_type is 'trade' or 'mixed'
    CASE 
        WHEN COALESCE(p.default_model_payment_type, 'cash') = 'cash' THEN 0
        ELSE COALESCE(pm.trade_fee, p.default_model_trade_fee, 0)
    END AS daily_trade_fee,
    
    -- Total Trade Value - ONLY if payment_type is 'trade' or 'mixed'
    CASE 
        WHEN COALESCE(p.default_model_payment_type, 'cash') = 'cash' THEN 0
        ELSE COALESCE(
            (SELECT COUNT(DISTINCT ps.id) FROM project_schedule ps WHERE ps.project_id = p.id),
            COALESCE(jsonb_array_length(p.schedule), 1)
        ) * COALESCE(pm.trade_fee, p.default_model_trade_fee, 0)
    END AS total_trade_value,
    
    -- Dates from project_schedule
    (SELECT MIN(ps.start_time) FROM project_schedule ps WHERE ps.project_id = p.id) AS first_work_date,
    (SELECT MAX(ps.start_time) FROM project_schedule ps WHERE ps.project_id = p.id) AS last_work_date,
    
    COALESCE(pm.currency, p.currency, 'GTQ') AS currency,
    
    -- Payment status: aggregate from model_assignments if exists, otherwise 'pending'
    COALESCE(
        (SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 'pending'
                WHEN COUNT(*) FILTER (WHERE ma.payment_status = 'paid') = COUNT(*) THEN 'paid'
                WHEN COUNT(*) FILTER (WHERE ma.payment_status = 'paid') > 0 THEN 'partial'
                ELSE 'pending'
            END
         FROM model_assignments ma 
         JOIN project_schedule ps ON ma.schedule_id = ps.id
         WHERE ps.project_id = p.id AND ma.model_id = m.id
        ),
        'pending'
    ) AS payment_status,
    
    -- Payment date from last paid assignment
    (SELECT MAX(ma.payment_date) 
     FROM model_assignments ma 
     JOIN project_schedule ps ON ma.schedule_id = ps.id
     WHERE ps.project_id = p.id AND ma.model_id = m.id AND ma.payment_status = 'paid'
    ) AS payment_date,
    
    -- Payment type from project (authoritative source)
    COALESCE(p.default_model_payment_type, 'cash') AS payment_type,
    
    -- Trade category
    COALESCE(
        (SELECT ma.trade_category 
         FROM model_assignments ma 
         JOIN project_schedule ps ON ma.schedule_id = ps.id
         WHERE ps.project_id = p.id AND ma.model_id = m.id
         LIMIT 1
        ),
        p.default_model_trade_category
    ) AS trade_category,
    
    -- Trade details
    COALESCE(
        (SELECT ma.trade_details 
         FROM model_assignments ma 
         JOIN project_schedule ps ON ma.schedule_id = ps.id
         WHERE ps.project_id = p.id AND ma.model_id = m.id
         LIMIT 1
        ),
        p.default_model_trade_details
    ) AS trade_details,
    
    -- Total Paid (Cash) - ONLY if payment_type is 'cash' or 'mixed'
    CASE 
        WHEN COALESCE(p.default_model_payment_type, 'cash') = 'trade' THEN 0
        ELSE COALESCE(
            (SELECT COUNT(*) FILTER (WHERE ma.payment_status = 'paid') * COALESCE(pm.agreed_fee, p.default_model_fee, 0)
             FROM model_assignments ma 
             JOIN project_schedule ps ON ma.schedule_id = ps.id
             WHERE ps.project_id = p.id AND ma.model_id = m.id
            ),
            0
        )
    END AS total_paid,
    
    -- Pending Amount: total minus paid (ONLY for cash when applicable)
    CASE 
        WHEN COALESCE(p.default_model_payment_type, 'cash') = 'trade' THEN 0
        ELSE 
            COALESCE(
                (SELECT COUNT(DISTINCT ps.id) FROM project_schedule ps WHERE ps.project_id = p.id),
                COALESCE(jsonb_array_length(p.schedule), 1)
            ) * COALESCE(pm.agreed_fee, p.default_model_fee, 0)
            -
            COALESCE(
                (SELECT COUNT(*) FILTER (WHERE ma.payment_status = 'paid') * COALESCE(pm.agreed_fee, p.default_model_fee, 0)
                 FROM model_assignments ma 
                 JOIN project_schedule ps ON ma.schedule_id = ps.id
                 WHERE ps.project_id = p.id AND ma.model_id = m.id
                ),
                0
            )
    END AS pending_amount,
    
    p.user_id
    
FROM projects_models pm
JOIN projects p ON pm.project_id = p.id
JOIN models m ON pm.model_id = m.id
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
WHERE pm.client_selection = 'approved'
  AND p.status = 'completed';
