/**
 * Interface for the API Site schema structure
 */

// Import interfaces using relative paths to ensure TypeScript can resolve them correctly
import type { ApiEnvironmentSchema } from "./apiEnvironment.interface";
import type { ApiEndPointSchema } from "./apiEndPoint.interface";

export interface ApiSiteSchema {
    name: string;
    title: string;
    description: string;
    versionNumber: string;
    isPublic: string;
    isSiteLoggingEnabled: string;
    apiLogReportName: string;
    apiEnvironment: ApiEnvironmentSchema[];
    apiEndPoint: ApiEndPointSchema[];
}