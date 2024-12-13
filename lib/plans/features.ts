// Here is where you define your plan features. You can input your Polar price ID and the feature name and it will check if the feature is enabled in the plan.

export interface FeatureLimit {
    type: 'unlimited' | 'count' | 'storage';
    value?: number;
    unit?: 'MB' | 'GB' | 'items'; //Set the units for your metered features
}

export interface Feature {
    name: string;
    enabled: boolean;
    description: string;
    limits?: FeatureLimit;
    dependencies?: string[];
}

export interface Plan {
    name: string;
    priceId: string;
    features: Feature[];
}

export const plans: Plan[] = [
    {
        name: 'free',
        priceId: 'price_1N6jQgK6Ej4a9uY2oXnV0Ml2',
        features: [
            { 
                name: 'email-password', 
                enabled: true,
                description: 'Basic email and password authentication'
            },
            { 
                name: 'organization-teams', 
                enabled: false,
                description: 'Team management within organizations',
                limits: { type: 'count', value: 1, unit: 'items' }
            },
            { 
                name: 'passkeys', 
                enabled: false,
                description: 'Passwordless authentication with passkeys',
                dependencies: ['email-verification']
            },
            { 
                name: 'multi-factor', 
                enabled: false,
                description: 'Two-factor authentication',
                dependencies: ['email-verification']
            },
            { 
                name: 'password-reset', 
                enabled: false,
                description: 'Password reset functionality'
            },
            { 
                name: 'email-verification', 
                enabled: false,
                description: 'Email verification system'
            },
            { 
                name: 'roles-permissions', 
                enabled: false,
                description: 'Role-based access control'
            },
            { 
                name: 'rate-limiting', 
                enabled: false,
                description: 'API rate limiting',
                limits: { type: 'count', value: 100, unit: 'items' }
            },
            { 
                name: 'session-management', 
                enabled: false,
                description: 'Advanced session management'
            },
        ],
    },
];

export const features: Feature[] = plans[0].features;

export interface FeatureContext {
    customLimits?: Record<string, FeatureLimit>;
}

// For organization-level tracking
// const protectedOrgFunction = withFeatureAccess(
//     {
//         subscriptionId,
//         organizationId,  // Provide organization ID
//         priceId,
//         featureName
//     },
//     {
//         onGranted: async () => { /* ... */ },
//         onDenied: async (reason) => { /* ... */ }
//     }
// );

// For user-level tracking
// const protectedUserFunction = withFeatureAccess(
//     {
//         subscriptionId,
//         userId,  // Provide user ID
//         priceId,
//         featureName
//     },
//     {
//         onGranted: async () => { /* ... */ },
//         onDenied: async (reason) => { /* ... */ }
//     }
// );