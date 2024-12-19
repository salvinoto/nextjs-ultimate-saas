import { Customer, CustomerSubscription } from "@polar-sh/sdk/models/components"

interface SubscriptionCardProps {
    subscription: CustomerSubscription
    cancelSubscription: (id: string) => Promise<void>
}

export function SubscriptionCard({ subscription, cancelSubscription }: SubscriptionCardProps) {
    return (
        <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-sm text-gray-600">Subscription ID: {subscription.id}</p>
            <p className="text-sm text-gray-600">Status: {subscription.status}</p>
            <p className="text-sm text-gray-600">Start Date: {subscription.currentPeriodStart?.toLocaleDateString()}</p>
            <p className="text-sm text-gray-600">End Date: {subscription.currentPeriodEnd?.toLocaleDateString()}</p>
            <button className="bg-red-500 text-white px-4 py-2 rounded-md mt-4" onClick={() => cancelSubscription(subscription.id)}>
                Cancel Subscription
            </button>
        </div>
    )
}