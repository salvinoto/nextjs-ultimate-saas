"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OtpVerification() {
	const [otp, setOtp] = useState("");
	const [isOtpSent, setIsOtpSent] = useState(false);
	const [message, setMessage] = useState("");
	const [isError, setIsError] = useState(false);
	const [isValidated, setIsValidated] = useState(false);
	const router = useRouter();

	const requestOTP = async () => {
		setIsOtpSent(true);
		setMessage("Sending OTP...");
		await client.twoFactor.sendOtp();
		setMessage("OTP sent to your email");
		setIsError(false);
	};

	const validateOTP = async () => {
		const res = await client.twoFactor.verifyOtp({
			code: otp,
		});
		if (res.data) {
			setMessage("OTP validated successfully");
			setIsError(false);
			setIsValidated(true);
			setTimeout(() => {
				router.push("/dashboard");
			}, 1000);
		} else {
			setIsError(true);
			setMessage("Invalid OTP");
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Two-Factor Authentication</CardTitle>
				<CardDescription>
					Verify your identity with a one-time password
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid w-full items-center gap-4">
					{!isOtpSent ? (
						<Button onClick={requestOTP} className="w-full">
							<Mail className="mr-2 h-4 w-4" /> Send OTP to Email
						</Button>
					) : (
						<>
							<div className="flex flex-col space-y-1.5 items-center">
								<Label htmlFor="otp">One-Time Password</Label>
								<Label className="py-2 text-center text-xs font-normal text-muted-foreground">
									Check your email for the OTP
								</Label>
								<InputOTP
									maxLength={6}
									value={otp}
									onChange={(value) => setOtp(value)}
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
							<Button
								onClick={validateOTP}
								disabled={otp.length !== 6 || isValidated}
								className="w-full"
							>
								Validate OTP
							</Button>
						</>
					)}
				</div>
				{message && (
					<div
						className={`flex items-center justify-center gap-2 mt-4 ${
							isError ? "text-red-500" : "text-green-500"
						}`}
					>
						{isError ? (
							<AlertCircle className="h-4 w-4" />
						) : (
							<CheckCircle2 className="h-4 w-4" />
						)}
						<p className="text-sm">{message}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
