import { polar } from '@/polar'
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const productId = url.searchParams.get('productId') ?? ''
    
    if (!productId) {
        return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }
    
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
        // Log the product ID for debugging
        console.log('Creating checkout for product:', productId)
        console.log('Polar Organization ID:', process.env.POLAR_ORGANIZATION_ID)

        // First verify the product exists in Polar
        try {
            const product = await polar.products.get({ id: productId })
            console.log('Product found:', product.id, product.name)
        } catch (productError) {
            console.error('Product lookup failed:', productError)
            return NextResponse.json(
                { 
                    error: 'Product not found', 
                    productId,
                    message: 'The product does not exist in your Polar organization. Please check your Polar dashboard.'
                },
                { status: 404 }
            )
        }

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
            products: [productId],
            successUrl: confirmationUrl,
            customerEmail: session.user.email,
            metadata,
        })

        return NextResponse.redirect(result.url)
    } catch (error) {
        console.error('Checkout creation failed:', error)
        
        // Extract error details for debugging
        if (error instanceof Error) {
            const errorMessage = error.message || 'Unknown error'
            const statusCode = (error as { statusCode?: number }).statusCode || 500
            
            // Log the full error for debugging
            console.error('Error details:', {
                message: errorMessage,
                statusCode,
                productId,
                stack: error.stack
            })
            
            return NextResponse.json(
                { 
                    error: 'Checkout creation failed', 
                    details: errorMessage,
                    productId 
                },
                { status: statusCode === 422 ? 422 : 500 }
            )
        }
        
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        )
    }
}