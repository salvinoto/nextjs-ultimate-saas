import Link from "next/link";
import type { Product } from "@polar-sh/sdk/models/components/product.js";
import { useMemo } from "react";
import type { Prisma } from "@prisma/client";

// For a Subscription with the correct relations as returned by getCurrentSubscription
type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
    include: {
        product: true;
        FeatureUsage: true;
    }
}>;

interface ProductCardProps {
    product: Product
    currentSubscription?: SubscriptionWithRelations | null
}

export const ProductCard = ({ product, currentSubscription }: ProductCardProps) => {
    // Handling just a single price for now
    // Remember to handle multiple prices for products if you support monthly & yearly pricing plans
    const firstPrice = product.prices[0]

    const price = useMemo(() => {
        switch (firstPrice.amountType) {
            case 'fixed':
                // The Polar API returns prices in cents - Convert to dollars for display
                return `$${firstPrice.priceAmount / 100}`
            case 'free':
                return 'Free'
            default:
                return 'Pay what you want'
        }
    }, [firstPrice])

    const isCurrentPlan = currentSubscription?.product?.id === product.id;

    return (
        <div>
            <div className="flex flex-col gap-y-24 justify-between p-12 rounded-3xl bg-neutral-950 h-full border border-neutral-900 max-w-sm">
                <div className="flex flex-col gap-y-8">
                    <div className="flex flex-col justify-between items-center">
                        {isCurrentPlan && (
                            <span className="text-sm px-3 py-1 mb-2 bg-green-500/10 text-green-500 rounded-full">Current Plan</span>
                        )}
                        <h1 className="text-3xl">{product.name}</h1>
                    </div>
                    <p className="text-neutral-400">{product.description}</p>
                    <ul>
                        {product.benefits.map((benefit) => (
                            <li key={benefit.id} className="flex flex-row gap-x-2 items-center">
                                {benefit.description}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex flex-row gap-x-4 justify-between items-center">
                    <Link
                        className={`h-8 flex flex-row items-center justify-center rounded-full font-medium px-4 ${isCurrentPlan
                            ? 'bg-neutral-700 text-white hover:bg-neutral-600'
                            : 'bg-white text-black hover:bg-neutral-100'
                            }`}
                        href={isCurrentPlan ? `/billing` : `/checkout?priceId=${firstPrice.id}`}
                    >
                        {isCurrentPlan ? 'Manage' : 'Buy'}
                    </Link>
                    <span className="text-neutral-500">{price}</span>
                </div>
            </div>
        </div>
    )
}