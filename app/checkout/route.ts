import { polar } from '@/polar'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const productPriceId = url.searchParams.get('priceId') ?? ''
    // Polar will replace {CHECKOUT_ID} with the actual checkout ID upon a confirmed checkout
    const confirmationUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/confirmation?checkout_id={CHECKOUT_ID}`

    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return NextResponse.redirect(new URL('/login', req.nextUrl))
    }

    const organization = await (auth.api as unknown as {
        getFullOrganization: (opts: { headers: Headers }) => Promise<{ id: string; name: string } | null>
    }).getFullOrganization({
        headers: await headers()
    })

    try {

        interface CheckoutMetadata {
            [key: string]: string | number | boolean;
        }

        const metadata: CheckoutMetadata = {
            userName: session.user.name,
            userId: session.user.id,
            isOrganization: !!organization?.id
        }

        // Only add organization fields if they exist
        if (organization?.id) {
            metadata.organizationId = organization.id
            metadata.organizationName = organization.name
        }

        const result = await polar.checkouts.create({
            products: [productPriceId],
            successUrl: confirmationUrl,
            customerEmail: session.user.email,
            metadata,
        })

        return NextResponse.redirect(result.url)
    } catch (error) {
        console.error(error)
        return NextResponse.error()
    }
}