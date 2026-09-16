import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // Everything except: NextAuth's own routes, the CRON_SECRET-protected
  // cron endpoints (which authenticate themselves and must stay reachable
  // by Vercel's scheduler without a browser session), the login page
  // itself, and Next.js internals/static assets.
  matcher: [
    "/((?!api/auth|api/cron|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
