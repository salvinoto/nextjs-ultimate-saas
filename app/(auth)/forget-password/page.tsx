"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { client } from "@/lib/auth-client";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Component() {
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError("");

		try {
			await client.requestPasswordReset({
				email,
				redirectTo: "/reset-password",
			});
			setIsSubmitted(true);
		} catch (err: any) {
			setError(err?.message || "An error occurred. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isSubmitted) {
		return (
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Check your email</CardTitle>
					<CardDescription>
						We&apos;ve sent a password reset link to your email.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Alert>
						<CheckCircle2 className="h-4 w-4" />
						<AlertDescription>
							If you don&apos;t see the email, check your spam folder.
						</AlertDescription>
					</Alert>
				</CardContent>
				<CardFooter>
					<Button
						variant="outline"
						className="w-full"
						onClick={() => setIsSubmitted(false)}
					>
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to reset password
					</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Forgot password</CardTitle>
				<CardDescription>
					Enter your email to reset your password
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit}>
					<div className="grid w-full items-center gap-4">
						<div className="flex flex-col space-y-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
					</div>
					{error && (
						<Alert variant="destructive" className="mt-4">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<Button className="w-full mt-4" type="submit" disabled={isSubmitting}>
						{isSubmitting ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							"Send reset link"
						)}
					</Button>
				</form>
			</CardContent>
			<CardFooter className="flex justify-center">
				<Link href="/sign-in">
					<Button variant="link" className="px-0">
						Back to sign in
					</Button>
				</Link>
			</CardFooter>
		</Card>
	);
}
