import { SignInButton, SignInFallback } from "@/components/sign-in-btn";
import { Suspense } from "react";
import Link from 'next/link'
import { polar } from '@/polar'
import { ProductCard } from '@/components/product-card'

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
	];
	// const { result } = await polar.products.list({
	// 	organizationId: process.env.POLAR_ORGANIZATION_ID!,
	// 	isArchived: false, // Only fetch products which are published
	// })
	return (
		<div className="min-h-[80vh] flex items-center justify-center overflow-hidden no-visible-scrollbar px-6 md:px-0">
			<main className="flex flex-col gap-4 row-start-2 items-center justify-center">
				<div className="flex flex-col gap-1">
					<h3 className="font-bold text-4xl text-black dark:text-white text-center">
						Better Auth.
					</h3>
					<p className="text-center break-words text-sm md:text-base">
						Official demo to showcase{" "}
						<a
							href="https://better-auth.com"
							target="_blank"
							className="italic underline"
						>
							better-auth.
						</a>{" "}
						features and capabilities. <br />
					</p>
				</div>
				<div className="md:w-10/12 w-full flex flex-col gap-4">
					<div className="flex flex-col gap-3 pt-2 flex-wrap">
						<div className="border-y py-2 border-dotted bg-secondary/60 opacity-80">
							<div className="text-xs flex items-center gap-2 justify-center text-muted-foreground ">
								<span className="text-center">
									All features on this demo are Implemented with better auth
									without any custom backend code
								</span>
							</div>
						</div>
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
					<Suspense fallback={<SignInFallback />}>
						<SignInButton />
					</Suspense>
					{/* <div className="flex flex-col gap-y-32 pt-4">
						<h1 className="text-5xl">Products</h1>
						<div className="grid grid-cols-4 gap-12">
							{result.items.map((product) => (
								<ProductCard key={product.id} product={product} />
							))}
						</div>
					</div> */}
				</div>
			</main>
		</div>
	);
}
