import { getCurrentCustomer } from '@/lib/payments';
import { polar } from '@/polar'
import { redirect, RedirectType } from 'next/navigation';

export default async function BillingPage() {
    const currentCustomer = await getCurrentCustomer()

    if (!currentCustomer) {
        return <div>No active customer found</div>
    }

    const session = await polar.customerSessions.create({
        customerId: currentCustomer.customer?.polarCustomerId ?? '',
    });

    redirect("https://sandbox.polar.sh/next-js-payements/portal?customer_session_token=" + session.token, 'push' as RedirectType)
}