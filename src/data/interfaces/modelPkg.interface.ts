/**
 * Interface for the Model Package schema structure
 */

export interface ModelPkgSchema {
    isImported: string;
    isSubscriptionAllowed: string;
    isSubscribed: string;
    role: string;
    name: string;
    pkgType: string;
}