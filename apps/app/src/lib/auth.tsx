import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, json, loadToken, request, saveToken } from "./api";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "owner" | "staff";
}

type AuthState =
  { status: "loading" } | { status: "anonymous" } | { status: "authenticated"; user: SessionUser };

interface AuthApi {
  state: AuthState;
  signIn(email: string, password: string): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

async function fetchSession(): Promise<SessionUser | null> {
  const data = await api<{ user: SessionUser } | null>("/api/auth/get-session").catch(() => null);
  return data?.user ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    void (async () => {
      await loadToken();
      const user = await fetchSession();
      setState(user ? { status: "authenticated", user } : { status: "anonymous" });
    })();
  }, []);

  const finishLogin = useCallback(async (res: Response) => {
    const newToken = res.headers.get("set-auth-token");
    if (newToken) await saveToken(newToken);
    const user = await fetchSession();
    setState(user ? { status: "authenticated", user } : { status: "anonymous" });
  }, []);

  const value = useMemo<AuthApi>(
    () => ({
      state,
      async signIn(email, password) {
        await finishLogin(
          await request("/api/auth/sign-in/email", { method: "POST", ...json({ email, password }) }),
        );
      },
      async signUp(name, email, password) {
        await finishLogin(
          await request("/api/auth/sign-up/email", { method: "POST", ...json({ name, email, password }) }),
        );
      },
      async signOut() {
        await request("/api/auth/sign-out", { method: "POST", ...json({}) }).catch(() => undefined);
        await saveToken(null);
        setState({ status: "anonymous" });
      },
    }),
    [state, finishLogin],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
