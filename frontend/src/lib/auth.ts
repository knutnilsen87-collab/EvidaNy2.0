export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
}

import { apiFetch, authHeaders, EVIDA_TENANT_HEADER } from "../api/client";
export { EVIDA_TENANT_HEADER };

const mockUser: User = {
  id: "00000000-0000-0000-0000-000000000102",
  email: "jurist@firma.no",
  name: "Advokat Hansen",
  tenantId: "00000000-0000-0000-0000-000000000101",
  roles: ["USER"]
};

type AuthResponse = Partial<User> & {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
};

function jwt() {
  return sessionStorage.getItem("jwt");
}

export const authService = {
  async checkAuth(): Promise<User | null> {
    const token = jwt();
    if (!token && import.meta.env.DEV && import.meta.env.VITE_EVIDA_DEV_AUTO_LOGIN === "true") {
      return mockUser;
    }

    if (!token) return null;

    const response = await apiFetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Kunne ikke validere EVIDA-sesjonen");
    }

    return normalizeUser((await response.json()) as AuthResponse);
  },

  getHeaders(tenantId: string): HeadersInit {
    return authHeaders(tenantId);
  }
};

function normalizeUser(response: AuthResponse): User {
  return {
    id: response.id,
    email: response.email,
    name: response.name ?? response.email,
    tenantId: response.tenantId,
    roles: response.roles
  };
}

export async function apiRequest<T>(
  path: string,
  user: User,
  init: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(path, {
    ...init,
    headers: {
      ...authService.getHeaders(user.tenantId),
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new Error(`EVIDA API-feil ${response.status}`);
  }

  return (await response.json()) as T;
}
