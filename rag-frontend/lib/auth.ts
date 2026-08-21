// FILE: lib/auth.ts

import {
  getApiBase,
  setToken,
  clearToken,
  getToken,
} from "./api";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
}

export { getToken };

export const logout = clearToken;


export function getInitials(
  user: AuthUser | null
): string {
  if (!user) return "?";

  if (user.name && user.name.trim()) {
    const parts = user.name.trim().split(/\s+/);

    const first = parts[0]?.[0] || "";
    const last =
      parts.length > 1
        ? parts[parts.length - 1]?.[0] || ""
        : "";

    return (
      first + last
    ).toUpperCase() || "?";
  }

  return user.email
    .slice(0, 2)
    .toUpperCase();
}


async function parseErrorDetail(
  res: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await res.json();

    return (
      data.detail ||
      data.message ||
      fallback
    );
  } catch {
    return fallback;
  }
}


// ============================================================================
// SIGNUP
// ============================================================================

export async function signup(
  email: string,
  password: string,
  name: string
): Promise<AuthUser> {
  const base = await getApiBase();

  const res = await fetch(
    `${base}/auth/signup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(
      await parseErrorDetail(
        res,
        `Signup failed (${res.status})`
      )
    );
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(
      "Login token was not returned by the server."
    );
  }

  setToken(data.access_token);

  return data.user;
}


// ============================================================================
// LOGIN
// ============================================================================

export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  const base = await getApiBase();

  const res = await fetch(
    `${base}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(
      await parseErrorDetail(
        res,
        `Login failed (${res.status})`
      )
    );
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(
      "Login token was not returned by the server."
    );
  }

  setToken(data.access_token);

  return data.user;
}


// ============================================================================
// CURRENT USER
// ============================================================================

/**
 * Important behavior:
 *
 * 401 / 403
 *   -> token is invalid/expired
 *   -> clear token
 *   -> return null
 *
 * Network/CORS/backend problems
 *   -> DO NOT clear token
 *   -> THROW the error
 *
 * This is important because a temporary backend/network problem must not
 * make AuthGuard think that the user logged out.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getToken();

  if (!token) {
    return null;
  }

  const base = await getApiBase();

  let res: Response;

  try {
    res = await fetch(
      `${base}/auth/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Unable to verify your session: ${error.message}`
        : "Unable to verify your session."
    );
  }

  if (res.status === 401 || res.status === 403) {
    clearToken();
    return null;
  }

  if (!res.ok) {
    const detail =
      await parseErrorDetail(
        res,
        `Authentication check failed (${res.status})`
      );

    throw new Error(detail);
  }

  const user = await res.json();

  if (
    !user ||
    typeof user.id !== "number" ||
    typeof user.email !== "string"
  ) {
    throw new Error(
      "The authentication server returned an invalid user."
    );
  }

  return user;
}