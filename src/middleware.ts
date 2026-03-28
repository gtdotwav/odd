import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const hasClerkKeys =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

const isProtectedRoute = createRouteMatcher([
  "/portfolio(.*)",
  "/carteira(.*)",
  "/watchlist(.*)",
  "/config(.*)",
  "/notificacoes(.*)",
  "/api/orders(.*)",
  "/api/wallet(.*)",
  "/api/portfolio(.*)",
  "/api/watchlist(.*)",
  "/api/notifications(.*)",
  "/api/comments(.*)",
]);

function defaultMiddleware(_req: NextRequest) {
  return NextResponse.next();
}

export default hasClerkKeys
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : defaultMiddleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
