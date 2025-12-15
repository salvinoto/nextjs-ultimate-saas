"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { client } from "@/lib/auth-client";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SetStateAction, useState } from "react";
import { toast } from "sonner";

export default function ResetPassword() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);
		setError("");
		const res = await client.resetPassword({
			newPassword: password,
		});
		if (res.error) {
			toast.error(res.error.message);
			setError(res.error.message ?? "An error occurred");
		} else {
			toast.success("Password reset successfully");
			router.push("/sign-in");
		}
		setIsSubmitting(false);
	}
	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Reset password</CardTitle>
				<CardDescription>
					Enter new password and confirm it to reset your password
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<div className="grid w-full items-center gap-4">
						<div className="flex flex-col space-y-1.5">
							<Label htmlFor="password">New password</Label>
							<PasswordInput
								id="password"
								value={password}
								onChange={(e: { target: { value: SetStateAction<string> } }) =>
									setPassword(e.target.value)
								}
								autoComplete="password"
								placeholder="Password"
							/>
						</div>
						<div className="flex flex-col space-y-1.5">
							<Label htmlFor="confirmPassword">Confirm password</Label>
							<PasswordInput
								id="confirmPassword"
								value={confirmPassword}
								onChange={(e: { target: { value: SetStateAction<string> } }) =>
									setConfirmPassword(e.target.value)
								}
								autoComplete="password"
								placeholder="Password"
							/>
						</div>
					</div>
					{error && (
						<Alert variant="destructive" className="mt-4">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<Button
						className="w-full mt-4"
						type="submit"
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							"Reset password"
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
