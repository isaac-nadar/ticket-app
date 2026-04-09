export { default } from "next-auth/middleware";

import { getToken } from "next-auth/jwt";


export async function proxy(req: any) {
  const token: any = await getToken({ req });

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute) {
    if (!token || token.user.role !== "admin") {
      return Response.redirect(new URL("/login", req.url));
    }
  }

  return null;
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};

