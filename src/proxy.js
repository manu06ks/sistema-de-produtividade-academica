

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "unistudy_session";

async function sessaoValida(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const logado = await sessaoValida(request);

  if (pathname === "/" && logado) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname !== "/" && !logado) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/grupos/:path*", "/stats/:path*", "/planos/:path*"],
};