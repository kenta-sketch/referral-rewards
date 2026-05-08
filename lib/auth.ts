import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION_DAYS = 30;

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * 邂｡逅・・Ο繧ｰ繧､繝ｳ繧定ｩｦ縺ｿ繧九よ・蜉滓凾縺ｫCookie繧偵そ繝・ヨ縲・ */
export async function attemptAdminLogin(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (!safeEq(password, expected)) return false;

  const expires = Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `admin:${expires}`;
  const signature = sign(payload);
  const value = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
  return true;
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * 迴ｾ蝨ｨ縺ｮ繝ｪ繧ｯ繧ｨ繧ｹ繝医′邂｡逅・・→縺励※譛牙柑縺九ｒ遒ｺ隱阪・ */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  if (!safeEq(signature, sign(payload))) return false;

  const [tag, expiresStr] = payload.split(":");
  if (tag !== "admin") return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;

  return true;
}

/**
 * Server Actions / Route Handlers 縺ｮ蜀帝ｭ縺ｧ蜻ｼ繧薙〒邂｡逅・・〒縺ｪ縺代ｌ縺ｰ throw 縺吶ｋ縲・ */
export async function requireAdmin(): Promise<void> {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    throw new Error("Unauthorized");
  }
}

