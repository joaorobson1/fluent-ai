import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const url = request.nextUrl.clone();

  const isAuthPage =
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/cadastro") ||
    url.pathname.startsWith("/recuperar-senha");

  const isProtectedPage =
    url.pathname.startsWith("/dashboard")    ||
    url.pathname.startsWith("/tarefas")      ||
    url.pathname.startsWith("/vocabulario")  ||
    url.pathname.startsWith("/conquistas")   ||
    url.pathname.startsWith("/perfil")       ||
    url.pathname.startsWith("/configuracoes")||
    url.pathname.startsWith("/onboarding");

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && isProtectedPage) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
