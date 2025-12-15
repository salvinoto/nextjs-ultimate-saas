import { Logo } from "@/components/logo";
import Link from "next/link";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden">
			{/* Radial gradient for the container to give a faded look */}
			<div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white mask-[radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
			
			<div className="z-10 w-full max-w-md px-4">
				<div className="flex justify-center mb-8">
					<Link href="/" className="flex items-center gap-2">
						<Logo className="w-8 h-8" />
						<span className="font-bold text-xl">NextJS Ultimate SaaS</span>
					</Link>
				</div>
				{children}
			</div>
		</div>
	);
}
