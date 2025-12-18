import { betterFetch } from "@better-fetch/fetch";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "./lib/auth-types";

// Paths that should skip the setup check
const SETUP_EXEMPT_PATHS = [
	"/setup",
	"/api/setup",
	"/_next",
	"/favicon",
	"/fonts",
];

function isSetupExemptPath(pathname: string): boolean {
	return SETUP_EXEMPT_PATHS.some((path) => pathname.startsWith(path));
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check for setup redirect in development mode
	if (!isSetupExemptPath(pathname)) {
		const isConfigured = !!process.env.DATABASE_URL && !!process.env.BETTER_AUTH_SECRET;
		const isDevelopment = process.env.NODE_ENV === "development";

		if (isDevelopment && !isConfigured) {
			return NextResponse.redirect(new URL("/setup", request.url));
		}
	}

	// Skip auth check for setup page
	if (pathname.startsWith("/setup")) {
		return NextResponse.next();
	}

	// Dashboard requires authentication
	if (pathname.startsWith("/dashboard")) {
		const { data: session } = await betterFetch<Session>(
			"/api/auth/get-session",
			{
				baseURL: request.nextUrl.origin,
				headers: {
					cookie: request.headers.get("cookie") || "",
				},
			},
		);

		if (!session) {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/setup/:path*", "/"],
};
