/**
 * Script to update a Polar customer with the correct externalId
 * 
 * This fixes the issue where customers were created before externalCustomerId
 * was implemented in the checkout flow.
 * 
 * Usage:
 *   npx tsx scripts/fix-polar-customer.ts <polarCustomerId> <userOrOrgId>
 * 
 * Example:
 *   npx tsx scripts/fix-polar-customer.ts 578bde91-05a4-4670-b45a-b5c94d709208 user_abc123
 */

import { Polar } from "@polar-sh/sdk";

async function main() {
    const [polarCustomerId, externalId] = process.argv.slice(2);

    if (!polarCustomerId || !externalId) {
        console.error('Usage: npx tsx scripts/fix-polar-customer.ts <polarCustomerId> <userOrOrgId>');
        console.error('');
        console.error('Arguments:');
        console.error('  polarCustomerId - The Polar customer ID (from the webhook error)');
        console.error('  userOrOrgId     - Your user ID or organization ID to link');
        process.exit(1);
    }

    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken) {
        console.error('Error: POLAR_ACCESS_TOKEN environment variable is required');
        process.exit(1);
    }

    const polar = new Polar({
        accessToken,
        server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    });

    console.log(`Updating Polar customer ${polarCustomerId} with externalId: ${externalId}`);
    console.log(`Server: ${process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'}`);

    try {
        // First, get the current customer to verify it exists
        const customer = await polar.customers.get({ id: polarCustomerId });
        console.log('Current customer:', {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            externalId: customer.externalId ?? '(not set)',
        });

        if (customer.externalId) {
            console.log(`\nCustomer already has externalId: ${customer.externalId}`);
            console.log('No update needed.');
            return;
        }

        // Update the customer with the externalId
        const updated = await polar.customers.update({
            id: polarCustomerId,
            customerUpdate: {
                externalId: externalId,
            }
        });

        console.log('\nCustomer updated successfully!');
        console.log('Updated customer:', {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            externalId: updated.externalId,
        });

    } catch (error) {
        console.error('Error updating customer:', error);
        process.exit(1);
    }
}

main();

