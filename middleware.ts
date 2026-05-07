import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function verifyHmac(payload: string, signatureHex: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  let sigBytes: Uint8Array;
  try {
    sigBytes = hexToBytes(signatureHex);
  } catch {
    return false;
  }
  return crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload));
}

async function verifyToken(token: string): Promise<boolean> {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const secret = process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";

  const ok = await verifyHmac(payload, signature, secret);
  if (!ok) return false;

  const [tag, expiresStr] = payload.split(":");
  if (tag !== "admin") return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || !(await verifyToken(token))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
