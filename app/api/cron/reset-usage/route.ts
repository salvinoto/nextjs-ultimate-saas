// app/api/cron/reset-usage/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// This endpoint will be called by Vercel Cron
export async function GET() {
    try {
        // Find all active subscriptions that need reset
        const subscriptions = await prisma.subscription.findMany({
            where: {
                status: 'active',
                currentPeriodEnd: {
                    // Find subscriptions whose period is ending
                    lte: new Date()
                }
            },
            include: {
                FeatureUsage: true
            }
        });

        // Reset usage for each subscription
        for (const subscription of subscriptions) {
            await prisma.$transaction(async (tx) => {
                for (const usage of subscription.FeatureUsage) {
                    await tx.featureUsage.update({
                        where: { id: usage.id },
                        data: { currentUsage: 0 }
                    });
                }
            });
        }

        return NextResponse.json({
            success: true,
            processedCount: subscriptions.length
        });
    } catch (error) {
        console.error('Failed to reset usage:', error);
        return NextResponse.json(
            { error: 'Failed to reset usage' },
            { status: 500 }
        );
    }
}