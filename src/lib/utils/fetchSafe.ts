export type FetchSafeResult<T = unknown> = {
  ok: boolean;
  status: number;
  json: T | null;
  error?: string;
}

export async function fetchSafe<T = unknown>(input: RequestInfo, init?: RequestInit): Promise<FetchSafeResult<T>> {
  try {
    const res = await fetch(input, init);
    let json: unknown = null;
    // CORRECCIÓN: Se elimina la variable '_e' no utilizada del catch
    try { json = await res.json(); } catch { json = null; }
    if (!res.ok) {
      // Try to extract error message safely from unknown json
        const asRecord = json && typeof json === 'object' ? (json as Record<string, unknown>) : null;
        const maybeErr = asRecord && 'error' in asRecord ? asRecord.error : (asRecord && 'message' in asRecord ? asRecord.message : null);
      const err = maybeErr ?? `Request failed with status ${res.status}`;
      return { ok: false, status: res.status, json: json as T, error: String(err) };
    }
    return { ok: true, status: res.status, json: json as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, json: null, error: message };
  }
}