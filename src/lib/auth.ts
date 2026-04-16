export const AUTH_TOKEN_STORAGE_KEY = "collablan.auth.token";

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginResponse = {
  token: string;
};

export type AuthUserProfile = {
  email?: string;
  name?: string;
};

export function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredAuthToken() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAuthToken() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function isAuthenticated() {
  return Boolean(getStoredAuthToken());
}

export function getStoredAuthProfile(): AuthUserProfile | null {
  const token = getStoredAuthToken();

  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as AuthUserProfile;

    return payload;
  } catch {
    return null;
  }
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getPasswordValidationMessage(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must include at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }

  return null;
}

async function readAuthResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as
    | { error?: string; token?: string }
    | null;

  if (!response.ok || !body?.token) {
    throw new Error(body?.error || "Authentication failed.");
  }

  return body as LoginResponse;
}

export async function loginWithPassword(payload: LoginPayload) {
  const response = await fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readAuthResponse(response);
}

export async function signupWithPassword(payload: SignupPayload) {
  const response = await fetch("/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readAuthResponse(response);
}
