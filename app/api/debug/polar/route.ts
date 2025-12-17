import { polar } from '@/polar'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const organizationId = process.env.POLAR_ORGANIZATION_ID

        if (!organizationId) {
            return NextResponse.json({
                error: 'POLAR_ORGANIZATION_ID is not set',
                env: {
                    POLAR_ORGANIZATION_ID: organizationId,
                    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN ? 'SET (hidden)' : 'NOT SET',
                }
            }, { status: 500 })
        }

        // List all products from Polar
        const { result } = await polar.products.list({
            organizationId,
            isArchived: false,
        })

        // Return products with their IDs and prices
        const products = result.items.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            isRecurring: product.isRecurring,
            isArchived: product.isArchived,
            prices: product.prices.map(price => ({
                id: price.id,
                amountType: price.amountType,
                priceAmount: 'priceAmount' in price ? price.priceAmount : null,
                priceCurrency: 'priceCurrency' in price ? price.priceCurrency : null,
            })),
        }))

        return NextResponse.json({
            success: true,
            organizationId,
            productsCount: products.length,
            products,
            message: products.length === 0 
                ? 'No products found. Make sure you have created products in your Polar dashboard for this organization.'
                : `Found ${products.length} products`
        })
    } catch (error) {
        console.error('Debug Polar error:', error)
        
        return NextResponse.json({
            error: 'Failed to fetch products from Polar',
            details: error instanceof Error ? error.message : 'Unknown error',
            env: {
                POLAR_ORGANIZATION_ID: process.env.POLAR_ORGANIZATION_ID || 'NOT SET',
                POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN ? 'SET (hidden)' : 'NOT SET',
            }
        }, { status: 500 })
    }
}

