import { createAuthClient } from "better-auth/react";
import {
	organizationClient,
	passkeyClient,
	twoFactorClient,
	adminClient,
	multiSessionClient,
	oneTapClient,
} from "better-auth/client/plugins";
import { ac, owner as ownerRole, admin as adminRole, member as memberRole, myCustomRole } from "@/lib/permissions"
import { toast } from "sonner";

export const client = createAuthClient({
	plugins: [
		organizationClient({
			ac: ac,
			roles: {
				owner: ownerRole,
				admin: adminRole,
				member: memberRole,
				myCustomRole
			}
		}),
		twoFactorClient({
			onTwoFactorRedirect() {
				window.location.href = "/two-factor";
			},
		}),
		passkeyClient(),
		adminClient(),
		multiSessionClient(),
		// oneTapClient({
		// 	clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
		// }),
	],
	fetchOptions: {
		onError(e) {
			if (e.error.status === 429) {
				toast.error("Too many requests. Please try again later.");
			}
		},
	},
});

export const {
	signUp,
	signIn,
	signOut,
	useSession,
	organization,
	useListOrganizations,
	useActiveOrganization,
} = client;
