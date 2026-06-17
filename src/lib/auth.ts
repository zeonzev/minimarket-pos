import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SessionUser,
  signSession,
  verifySession,
} from "./session";

export type { SessionUser };

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Obliga a tener sesión; redirige a /login si no hay. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Exige uno de los roles indicados; redirige al dashboard si no cumple. */
export async function requireRole(...roles: string[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.rol)) redirect("/");
  return session;
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
