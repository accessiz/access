-- =============================================
-- MIGRACIÓN: Sistema de Clientes y Marcas
-- Fecha: 2024-12-23
-- =============================================

-- 1. Crear tabla de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de Marcas
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Agregar columnas nuevas a la tabla projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS project_types TEXT[] DEFAULT '{}';

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_brands_client_id ON brands(client_id);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_brand_id ON projects(brand_id);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para clients
CREATE POLICY "Users can view their own clients" ON clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Políticas RLS para brands
CREATE POLICY "Users can view their own brands" ON brands
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brands" ON brands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands" ON brands
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands" ON brands
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Triggers para updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Comentarios para documentación
COMMENT ON TABLE clients IS 'Contactos de clientes (personas que representan una o más marcas)';
COMMENT ON TABLE brands IS 'Marcas asociadas a clientes';
COMMENT ON COLUMN projects.client_id IS 'Referencia al cliente registrado (opcional)';
COMMENT ON COLUMN projects.brand_id IS 'Referencia a la marca del cliente (opcional)';
COMMENT ON COLUMN projects.project_types IS 'Array de tipos de proyecto: photoshoot, tv_commercial, ecommerce, runway, social_media, cinema, corporate, editorial, music_video, other';

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================
