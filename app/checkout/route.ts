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

  const organization = await auth.api.getFullOrganization({
    headers: await headers()
  })

  try {

    interface CheckoutMetadata {
      [key: string]: string | number | boolean;
    }

    const checkoutData = {
      productPriceId,
      successUrl: confirmationUrl,
      customerEmail: session.user.email,
      metadata: {
        userName: session.user.name,
        userId: session.user.id,
        isOrganization: !!organization?.id
      } as CheckoutMetadata
    }

    // Only add organization fields if they exist
    if (organization?.id) {
      checkoutData.metadata.organizationId = organization.id
      checkoutData.metadata.organizationName = organization.name
    }

    const result = await polar.checkouts.custom.create(checkoutData)

    return NextResponse.redirect(result.url)
  } catch (error) {
    console.error(error)
    return NextResponse.error()
  }
}