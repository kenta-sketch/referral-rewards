import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const buf = new ArrayBuffer(hex.length / 2);
  const view = new Uint8Array(buf);
  for (let i = 0; i < view.length; i++) {
    view[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return buf;
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
  let sigBuffer: ArrayBuffer;
  try {
    sigBuffer = hexToArrayBuffer(signatureHex);
  } catch {
    return false;
  }
  return crypto.subtle.verify("HMAC", key, sigBuffer, enc.encode(payload));
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
