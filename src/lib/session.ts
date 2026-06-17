// Utilidades de sesión seguras para edge runtime (solo jose, sin next/headers).
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "minimarket-unifranz-2026-clave-secreta-pos-sistema"
);

export const SESSION_COOKIE = "mm_session";

export type SessionUser = {
  id: number;
  nombre: string;
  usuario: string;
  rol: string; // ADMIN | CAJERO | ALMACENERO
};

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as number,
      nombre: payload.nombre as string,
      usuario: payload.usuario as string,
      rol: payload.rol as string,
    };
  } catch {
    return null;
  }
}
