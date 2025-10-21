export type FetchSafeResult<T = any> = {
  ok: boolean;
  status: number;
  json: T | null;
  error?: string;
}

export async function fetchSafe<T = any>(input: RequestInfo, init?: RequestInit): Promise<FetchSafeResult<T>> {
  try {
    const res = await fetch(input, init);
    let json: any = null;
    try { json = await res.json(); } catch (e) { json = null; }
    if (!res.ok) {
      const err = json?.error || json?.message || `Request failed with status ${res.status}`;
      return { ok: false, status: res.status, json, error: String(err) };
    }
    return { ok: true, status: res.status, json: json as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, json: null, error: message };
  }
}
