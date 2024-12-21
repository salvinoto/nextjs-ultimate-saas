import { getCurrentCustomer } from '@/lib/payments';
import { polar } from '@/polar'
import { forbidden, redirect, RedirectType } from 'next/navigation';

export default async function BillingPage() {
    const currentCustomer = await getCurrentCustomer()

    if (!currentCustomer) {
        forbidden()
    }

    const session = await polar.customerSessions.create({
        customerId: currentCustomer.customer?.polarCustomerId ?? '',
    });

    const organizationName = (process.env.POLAR_ORGANIZATION_NAME ?? '')
        .toLowerCase()
        .replace(/\s+/g, '-');

    const baseUrl = 'https://sandbox.polar.sh';
    const portalUrl = new URL(`${organizationName}/portal`, baseUrl);
    portalUrl.searchParams.set('customer_session_token', session.token);

    redirect(portalUrl.toString(), 'push' as RedirectType)

}
