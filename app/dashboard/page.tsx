import { SignInButton, SignInFallback } from "@/components/sign-in-btn";
import { Suspense } from "react";
import Link from 'next/link'
import { polar } from '@/polar'
import { ProductCard } from '@/components/product-card'
import { getActiveSubscription, getCurrentCustomer } from "@/lib/payments";
import { checkCurrentLimit, getAllUsage } from "@/lib/metering";

export const dynamic = 'force-dynamic'

export default async function Home() {
	const features = [
		"Email & Password",
		"Organization | Teams",
		"Passkeys",
		"Multi Factor",
		"Password Reset",
		"Email Verification",
		"Roles & Permissions",
		"Rate Limiting",
		"Session Management",
		"Prisma Database",
		"Payments with Polar",
		"Usage-Based Billing with Polar Meters"
	];

	const { result } = await polar.products.list({
		organizationId: process.env.POLAR_ORGANIZATION_ID!,
		isArchived: false,
	})
	
	const currentSubscription = await getActiveSubscription()
	const currentCustomer = await getCurrentCustomer()

	// Check feature access using Polar meters
	let featureAccessStatus: { allowed: boolean; reason?: string } = { allowed: false, reason: 'No subscription' };
	
	if (currentSubscription) {
		// Check storage limit using the new metering system
		featureAccessStatus = await checkCurrentLimit('storage_gb');
	}

	return (
		<div className="flex items-center justify-center overflow-hidden no-visible-scrollbar px-6 md:px-0">
			<main className="flex flex-col gap-4 row-start-2 items-center justify-center">
				<div className="md:w-10/12 w-full flex flex-col gap-4">
					<div className="flex flex-col gap-3 pt-2 flex-wrap">
						<div className="flex gap-2 justify-center flex-wrap">
							{features.map((feature) => (
								<span
									className="border-b pb-1 text-muted-foreground text-xs cursor-pointer hover:text-foreground duration-150 ease-in-out transition-all hover:border-foreground flex items-center gap-1"
									key={feature}
								>
									{feature}.
								</span>
							))}
						</div>
					</div>
					{currentSubscription?.productId && (
						<div className="flex flex-col gap-3 border-y py-2 border-dotted bg-secondary/60 opacity-80">
							<div className="text-xs flex items-center gap-2 justify-center text-muted-foreground">
								<span className="text-center">
									You are currently subscribed to the{" "}
									<Link
										href={`/products/${currentSubscription?.productId}`}
										className="italic underline"
									>
										{currentSubscription?.product?.name}
									</Link>
								</span>
							</div>
						</div>
					)}
					{currentSubscription && (
						featureAccessStatus.allowed ? (
							<div className="flex flex-col gap-3 border-y py-2 border-dotted bg-secondary/60 opacity-80">
								<div className="text-xs flex items-center gap-2 justify-center text-muted-foreground">
									<span className="text-center">
										You have access to Storage feature!
									</span>
								</div>
							</div>
						) : (
							<div className="flex flex-col gap-3 border-y py-2 border-dotted bg-red-100 opacity-80">
								<div className="text-xs flex items-center gap-2 justify-center text-red-600">
									<span className="text-center">
										{featureAccessStatus.reason || 'Storage limit reached'}
									</span>
								</div>
							</div>
						)
					)}
					<div className="flex flex-col gap-y-32 pt-4">
						<h1 className="text-5xl">Products</h1>
						<div className={`grid gap-6 md:gap-8 lg:gap-12 ${result.items.length === 1 ? 'grid-cols-1' :
								result.items.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
									result.items.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
										'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
							}`}>
							{result.items.map((product) => (
								<ProductCard
									key={product.id}
									product={product}
									currentSubscription={currentSubscription}
								/>
							))}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
