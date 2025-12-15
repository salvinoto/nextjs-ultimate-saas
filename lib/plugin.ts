import { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "@better-auth/core/api";

export const addAccountToSession = {
	id: "add-account-to-session",
	hooks: {
		after: [
			{
				matcher(context: { path: string }) {
					return context.path.startsWith("/callback");
				},
				handler: createAuthMiddleware(async (ctx) => {
					const sessionCookie = ctx.context.responseHeaders?.get(
						ctx.context.authCookies.sessionToken.name,
					);
					if (!sessionCookie) {
						return;
					}
					const provider = ctx.path.split("/callback")[1];
					if (!provider) {
						return;
					}
					const sessionId = sessionCookie.split(".")[0];
					await ctx.context.internalAdapter.updateSession(sessionId, {
						accountId: provider,
					});
				}),
			},
		],
	},
	schema: {
		session: {
			fields: {
				accountId: {
					type: "string",
					required: false,
				},
			},
		},
	},
} satisfies BetterAuthPlugin;
