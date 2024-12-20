// Type definitions for feature limits and configurations
export type StorageUnit = 'MB' | 'GB';
export type CountUnit = 'items';
export type LimitUnit = StorageUnit | CountUnit;
export type LimitType = 'unlimited' | 'count' | 'storage';
export type ResetFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface FeatureLimit {
    readonly type: LimitType;
    readonly value?: number;
    readonly unit?: LimitUnit;
    readonly resetFrequency?: ResetFrequency;
}

// Strongly typed feature definition interface
interface FeatureDefinition {
    readonly name: string;
    readonly description: string;
    readonly defaultLimit: Readonly<FeatureLimit>;
    readonly dependencies: readonly string[];
}

// Type helper function to preserve literal types
const defineFeatures = <T extends Record<string, FeatureDefinition>>(features: T & Record<string, FeatureDefinition>): T => features;

// Define available features with strict typing
export const featureDefinitions = defineFeatures({
    serverStorage: {
        name: 'Server Storage',
        description: 'Storage for your server',
        defaultLimit: { type: 'storage', unit: 'GB', resetFrequency: 'monthly' },
        dependencies: [],
    },
    apiRequests: {
        name: 'API Requests',
        description: 'Number of API requests per month',
        defaultLimit: { type: 'count', unit: 'items', resetFrequency: 'monthly' },
        dependencies: ['serverStorage']
    }
} as const);

// Type utilities
type FeatureKey = keyof typeof featureDefinitions;
export type FeatureNames = typeof featureDefinitions[FeatureKey]['name'];

// Feature configuration interfaces
interface FeatureConfig {
    readonly enabled: boolean;
    readonly limits?: Readonly<FeatureLimit>;
}

export interface Feature extends FeatureConfig {
    readonly name: FeatureNames;
    readonly description: string;
    readonly dependencies: readonly string[];
}

export interface Plan {
    readonly name: string;
    readonly priceId: string;
    readonly features: readonly Feature[];
}

// Type-safe helper function to create a feature
const assignFeature = <K extends FeatureKey>(
    key: K,
    config: FeatureConfig
): Feature => ({
    name: featureDefinitions[key].name,
    description: featureDefinitions[key].description,
    dependencies: featureDefinitions[key].dependencies,
    ...config
});

// Define plans with strict typing
export const plans = [{
    name: 'Starter',
    priceId: '20fe5b7a-3f89-4b25-932f-101c9cba93d5',
    features: [
        assignFeature('serverStorage', {
            enabled: true,
            limits: { 
                ...featureDefinitions.serverStorage.defaultLimit,
                value: 5,
            },
        }),
        assignFeature('apiRequests', {
            enabled: true,
            limits: {
                ...featureDefinitions.apiRequests.defaultLimit,
                value: 1000,
            },
        })
    ],
}, {
    name: 'Ultimate',
    priceId: 'c73a2acc-e799-417a-881d-730a8dae084a',
    features: [
        assignFeature('serverStorage', {
            enabled: true,
            limits: {
                ...featureDefinitions.serverStorage.defaultLimit,
                value: 10
            },
        }),
        assignFeature('apiRequests', {
            enabled: true,
            limits: {
                ...featureDefinitions.apiRequests.defaultLimit,
                value: 10000,
                resetFrequency: 'monthly'
            },
        })
    ]
}] as const;

// Export the default features (from the free plan)
export const features: readonly Feature[] = plans[0].features;

// Feature context interface for custom limits
export interface FeatureContext {
    readonly customLimits?: Readonly<Record<string, FeatureLimit>>;
}

/*
Example usage for organization-level tracking:
const protectedOrgFunction = withFeatureAccess(
    {
        subscriptionId,
        organizationId,  // Provide organization ID
        priceId,
        featureName
    },
    {
        onGranted: async () => { },
        onDenied: async (reason) => { }
    }
);

Example usage for user-level tracking:
const protectedUserFunction = withFeatureAccess(
    {
        subscriptionId,
        userId,  // Provide user ID
        priceId,
        featureName
    },
    {
        onGranted: async () => { },
        onDenied: async (reason) => { }
    }
);
*/