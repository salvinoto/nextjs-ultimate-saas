import { getCurrentSubscription } from '@/lib/plans/db'
import { polar } from '@/polar'
import { SubscriptionTable } from './subscription-table'

export default async function BillingPage() {
    const subscription = await getCurrentSubscription()
    const subscriptions = await polar.customerPortal.subscriptions.list({
        organizationId: process.env.POLAR_ORGANIZATION_ID!,
    });

    const handleCancelSubscription = async (id: string) => {
        'use server'
        await polar.customerPortal.subscriptions.cancel({
            id: id
        });
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">Billing</h1>
            <SubscriptionTable
                initialSubscriptions={subscriptions.result.items || []}
                cancelSubscription={handleCancelSubscription}
            />
        </div>
    )
}