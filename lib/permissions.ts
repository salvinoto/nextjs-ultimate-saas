import { createAccessControl } from "better-auth/plugins/access";

// Define all permission statements including defaults and custom ones
const statement = {
    // Default organization permissions
    organization: ["update", "delete"],
    // Default member permissions
    member: ["create", "update", "delete"],
    // Default invitation permissions
    invitation: ["create", "cancel"],
    // Custom project permissions
    project: ["create", "share", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

// Member role - read-only access with limited project creation
const member = ac.newRole({
    project: ["create"],
});

// Admin role - full control except organization deletion
const admin = ac.newRole({
    organization: ["update"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    project: ["create", "update"],
});

// Owner role - complete control over everything
const owner = ac.newRole({
    organization: ["update", "delete"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
    project: ["create", "update", "delete"],
});

// Custom role example
const myCustomRole = ac.newRole({
    project: ["create", "update", "delete"],
    organization: ["update"],
});

export { ac, member, admin, owner, myCustomRole };
