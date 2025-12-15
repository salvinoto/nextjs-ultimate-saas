import type { auth } from "./auth";
import { client } from "./auth-client";

// Base session type from Better Auth
type BaseSession = typeof auth.$Infer.Session;

// Extended session type that includes two-factor fields
export type Session = Omit<BaseSession, 'user'> & {
	user: BaseSession['user'] & {
		twoFactorEnabled?: boolean;
	};
};
export type ActiveOrganization = typeof client.$Infer.ActiveOrganization;
export type Invitation = typeof client.$Infer.Invitation;
