"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { client } from "@/lib/auth-client";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TotpVerification() {
	const [totpCode, setTotpCode] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (totpCode.length !== 6) {
			setError("TOTP code must be 6 digits");
			return;
		}
		setIsSubmitting(true);
		client.twoFactor
			.verifyTotp({
				code: totpCode,
			})
			.then((res) => {
				if (res.data?.token) {
					setSuccess(true);
					setError("");
					setTimeout(() => {
						router.push("/dashboard");
					}, 1000);
				} else {
					setError("Invalid TOTP code");
					setIsSubmitting(false);
				}
			})
			.catch((err) => {
				setError("An error occurred");
				setIsSubmitting(false);
			});
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>TOTP Verification</CardTitle>
				<CardDescription>
					Enter your 6-digit TOTP code to authenticate
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!success ? (
					<form onSubmit={handleSubmit}>
						<div className="space-y-2 flex flex-col items-center justify-center">
							<Label htmlFor="totp">TOTP Code</Label>
							<InputOTP
								maxLength={6}
								value={totpCode}
								onChange={(value) => setTotpCode(value)}
							>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
								</InputOTPGroup>
								<InputOTPSeparator />
								<InputOTPGroup>
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
						</div>
						{error && (
							<div className="flex items-center justify-center mt-2 text-red-500">
								<AlertCircle className="w-4 h-4 mr-2" />
								<span className="text-sm">{error}</span>
							</div>
						)}
						<Button
							type="submit"
							className="w-full mt-4"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<Loader2 className="animate-spin w-4 h-4" />
							) : (
								"Verify"
							)}
						</Button>
					</form>
				) : (
					<div className="flex flex-col items-center justify-center space-y-2">
						<CheckCircle2 className="w-12 h-12 text-green-500" />
						<p className="text-lg font-semibold">Verification Successful</p>
					</div>
				)}
			</CardContent>
			<CardFooter className="text-sm text-muted-foreground gap-2 justify-center">
				<Link href="/two-factor/otp">
					<Button variant="link" size="sm">
						Switch to Email Verification
					</Button>
				</Link>
			</CardFooter>
		</Card>
	);
}
