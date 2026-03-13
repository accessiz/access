import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit, strictLimiter } from '@/lib/utils/rate-limit';

/**
 * POST /api/csp-report
 *
 * Receives Content-Security-Policy violation reports from browsers.
 * Logs them as structured JSON for Vercel Log Drain / monitoring.
 *
 * Rate limited: 10 req/min to prevent abuse.
 * No auth required — browsers send these automatically.
 */
export async function POST(req: NextRequest) {
  const blocked = applyRateLimit(req, strictLimiter);
  if (blocked) return blocked;

  try {
    const body = await req.json();

    // Reporting API v2 sends an array of report objects
    const reports = Array.isArray(body) ? body : [body];

    for (const item of reports) {
      // v1 (report-uri): { "csp-report": {...} }
      // v2 (report-to): { type: "csp-violation", body: {...} }
      const report = item['csp-report'] ?? item.body ?? item;

      logger.warn('CSP violation', {
        blockedUri: report['blocked-uri'] ?? report.blockedURL,
        violatedDirective: report['violated-directive'] ?? report.effectiveDirective,
        documentUri: report['document-uri'] ?? report.documentURL,
        sourceFile: report['source-file'] ?? report.sourceFile,
        lineNumber: report['line-number'] ?? report.lineNumber,
        disposition: report.disposition,
        reportVersion: item.type ? 'v2' : 'v1',
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    // Malformed body — ignore silently but return 400
    return new NextResponse(null, { status: 400 });
  }
}
