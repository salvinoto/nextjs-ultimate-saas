import { getCurrentSubscription } from '@/lib/plans/db'
import { polar } from '@/polar'
import { SubscriptionCard } from './subscription-card';

export default async function BillingPage() {
    const subscription = await getCurrentSubscription()
    console.log(subscription?.id)
    const polarSub = await polar.customerPortal.subscriptions.get({
        id: subscription?.id!
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

            <SubscriptionCard subscription={polarSub} cancelSubscription={handleCancelSubscription} />
        </div>
    )
}
