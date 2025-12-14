import React from 'react'
import Link from 'next/link'
import { HeroHeader } from './header'
import { SignInButton, SignInFallback } from '@/components/sign-in-btn'
import { ThemeToggle } from '@/components/theme-toggle'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'

export default function HeroSection() {
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
        "Subscription Permissions with Metering"
    ];

    return (
        <>
            <HeroHeader 
                actionButton={
                    <Suspense fallback={<SignInFallback />}>
                        <SignInButton />
                    </Suspense>
                }
                themeToggle={<ThemeToggle />}
            />
            <main className="overflow-x-hidden">
                <section>
                    <div className="py-24 md:pb-32 lg:pb-36 lg:pt-32">
                        <div className="relative mx-auto flex max-w-7xl flex-col px-6 lg:block lg:px-12">
                            <div className="mx-auto max-w-4xl text-center">
                                <h1 className="mt-8 text-balance text-5xl md:text-6xl lg:mt-16 xl:text-7xl font-bold text-black dark:text-white">
                                    NextJS Ultimate SaaS Starter
                                </h1>
                                <p className="mt-8 max-w-2xl mx-auto text-balance text-lg text-muted-foreground">
                                    Official demo to showcase{" "}
                                    <Link 
                                        href="https://nextjs-ultimate-saas.vercel.app" 
                                        target="_blank" 
                                        className="italic underline text-primary"
                                    >
                                        NextJS Ultimate SaaS Starter
                                    </Link>{" "}
                                    features and capabilities.
                                </p>

                                <div className="mt-12 flex flex-col items-center justify-center gap-4">
                                    <Suspense fallback={<SignInFallback />}>
                                        <SignInButton />
                                    </Suspense>
                                    
                                    <div className="mt-4 border-y py-2 border-dotted bg-secondary/60 opacity-80 px-4 rounded-sm">
                                        <div className="text-xs flex items-center gap-2 justify-center text-muted-foreground">
                                            <span className="text-center">
                                                All features on this starter kit are implemented with better-auth, Polar, and Prisma.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section className="pb-12">
                     <div className="max-w-5xl mx-auto px-6">
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                            {features.map((feature) => (
                                <Badge 
                                    variant="outline" 
                                    key={feature} 
                                    className="text-sm py-1.5 px-4 font-normal text-muted-foreground hover:text-foreground hover:border-foreground transition-all duration-150 cursor-pointer"
                                >
                                    {feature}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}
