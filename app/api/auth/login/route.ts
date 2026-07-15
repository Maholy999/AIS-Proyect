import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json() as { email?: unknown; password?: unknown };
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return NextResponse.json({ error: "Ingresa tu correo y contraseña." }, { status: 400 });
    }
    const { data, error } = await getAdminClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ACCESS_TOKEN_COOKIE, data.session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.session.expires_in
    });
    return response;
  } catch {
    return NextResponse.json({ error: "No fue posible iniciar sesión." }, { status: 500 });
  }
}
