import { getCurrentSubscription } from '@/lib/plans/db'

export default async function BillingPage() {
    const subscription = await getCurrentSubscription()
    return (
        <div className="flex h-full w-full flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">Billing</h1>
            <p>{JSON.stringify(subscription, null, 2)}</p>
        </div>
    )
}