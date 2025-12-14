/**
 * Polar Meters Setup Script
 * 
 * Run this script once to create the required meters in your Polar account.
 * You can also create these manually in the Polar dashboard.
 * 
 * Usage: npx tsx lib/metering/setup-meters.ts
 */

import { polar } from '@/polar';

interface MeterConfig {
  name: string;
  slug: string;
  filter: {
    conjunction: 'and' | 'or';
    clauses: Array<{
      property: string;
      operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'not_like';
      value: string | number | boolean;
    }>;
  };
  aggregation: 
    | { func: 'count' }
    | { func: 'sum'; property: string }
    | { func: 'max'; property: string }
    | { func: 'min'; property: string }
    | { func: 'avg'; property: string }
    | { func: 'unique'; property: string };
}

const METERS: MeterConfig[] = [
  {
    name: 'API Requests',
    slug: 'api_requests',
    filter: {
      conjunction: 'and',
      clauses: [{ property: 'name', operator: 'eq', value: 'api.request' }],
    },
    aggregation: { func: 'count' },
  },
  {
    name: 'Storage (GB)',
    slug: 'storage_gb',
    filter: {
      conjunction: 'and',
      clauses: [{ property: 'name', operator: 'eq', value: 'storage.update' }],
    },
    aggregation: { func: 'max', property: 'size_gb' },
  },
  {
    name: 'AI Tokens',
    slug: 'ai_tokens',
    filter: {
      conjunction: 'and',
      clauses: [{ property: 'name', operator: 'eq', value: 'ai.tokens' }],
    },
    aggregation: { func: 'sum', property: 'tokens' },
  },
  {
    name: 'Team Seats',
    slug: 'team_seats',
    filter: {
      conjunction: 'and',
      clauses: [{ property: 'name', operator: 'eq', value: 'seat.active' }],
    },
    aggregation: { func: 'unique', property: 'user_id' },
  },
];

async function setupMeters() {
  const organizationId = process.env.POLAR_ORGANIZATION_ID;
  
  if (!organizationId) {
    console.error('POLAR_ORGANIZATION_ID environment variable is required');
    process.exit(1);
  }

  console.log('Setting up Polar meters...\n');

  for (const meter of METERS) {
    try {
      console.log(`Creating meter: ${meter.name}...`);
      
      const result = await polar.meters.create({
        name: meter.name,
        filter: meter.filter,
        aggregation: meter.aggregation,
        organizationId,
        metadata: { slug: meter.slug },
      });

      console.log(`  Created: ${result.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if meter already exists
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        console.log(`  Meter "${meter.name}" already exists, skipping...`);
      } else {
        console.error(`  Failed to create meter "${meter.name}":`, errorMessage);
      }
    }
  }

  console.log('\nMeter setup complete!');
  console.log('\nNext steps:');
  console.log('1. Go to your Polar dashboard to verify the meters');
  console.log('2. Add metered prices to your products');
  console.log('3. Start tracking usage with the metering client');
}

// Run if executed directly
setupMeters().catch(console.error);

export { METERS, setupMeters };
