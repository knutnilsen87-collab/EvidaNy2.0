/**
 * EVIDA API-klient — ENESTE modul i frontenden som kjenner HTTP-transport:
 * base-URL, autentiseringsheadere og tenant-headeren (A-10).
 *
 * Alle andre moduler kaller `apiFetch`/`authHeaders`/`getHeaders` herfra.
 * Ingen andre filer skal kalle `fetch` mot EVIDA-backenden direkte.
 *
 * `X-Evida-Tenant-ID` er en klientpåstand som backenden alltid verifiserer
 * mot token — den er aldri selvstendig autorisasjonsbevis.
 */

export const EVIDA_TENANT_HEADER = "X-Evida-Tenant-ID";

export function apiBaseUrl(): string {
  return import.meta.env.VITE_EVIDA_API_BASE_URL ?? "";
}

function jwt(): string | null {
  return sessionStorage.getItem("jwt");
}

/** Authorization + tenant-header, uten Content-Type (for GET/multipart). */
export function authHeaders(tenantId: string): HeadersInit {
  const token = jwt();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    [EVIDA_TENANT_HEADER]: tenantId
  };
}

/** Authorization + tenant-header + JSON Content-Type (for JSON-kall). */
export function getHeaders(tenantId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...authHeaders(tenantId)
  };
}

/** Kun Authorization-header (auth-flyten før tenant er kjent). */
export function bearerHeaders(): HeadersInit {
  const token = jwt();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Transportkjernen: prepender base-URL og utfører kallet. Returnerer rå
 * `Response` slik at kallere beholder full semantikk (statuskoder,
 * streaming-body for SSE, blob-nedlasting).
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${apiBaseUrl()}${path}`, init);
}
