import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "unistudy_session";
const DURACAO_SEGUNDOS = 60 * 60 * 24 * 7; // 7 dias

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ausente ou curto demais (mínimo 32 caracteres).");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId) {
  const expira = Math.floor(Date.now() / 1000) + DURACAO_SEGUNDOS;

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(expira)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = getSecret();
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const userId = Number(payload.sub);
    return Number.isInteger(userId) ? { userId } : null;
  } catch {
    return null; // token adulterado, mal formado ou expirado
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}