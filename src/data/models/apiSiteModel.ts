/**
 * API site model that represents an API site in the App DNA schema
 */

import { ApiSiteSchema, ApiEnvironmentSchema, ApiEndPointSchema } from "../interfaces";

export class ApiSiteModel implements ApiSiteSchema {
    name: string;
    title?: string;
    description?: string;
    versionNumber?: string;
    isPublic?: string;
    isSiteLoggingEnabled?: string;
    apiLogReportName?: string;
    apiEnvironment?: ApiEnvironmentSchema[];
    apiEndPoint?: ApiEndPointSchema[];

    constructor(data?: Partial<ApiSiteSchema>) {
        // Optional properties are only assigned if they exist in data
        this.name = data.name;
        if (data?.title !== undefined) { this.title = data.title; }
        if (data?.description !== undefined) { this.description = data.description; }
        if (data?.versionNumber !== undefined) { this.versionNumber = data.versionNumber; }
        if (data?.isPublic !== undefined) { this.isPublic = data.isPublic; }
        if (data?.isSiteLoggingEnabled !== undefined) { this.isSiteLoggingEnabled = data.isSiteLoggingEnabled; }
        if (data?.apiLogReportName !== undefined) { this.apiLogReportName = data.apiLogReportName; }
        if (data?.apiEnvironment !== undefined) { this.apiEnvironment = data.apiEnvironment; }
        if (data?.apiEndPoint !== undefined) { this.apiEndPoint = data.apiEndPoint; }
    }

    /**
     * Create a new empty API site model
     */
    public static createEmpty(): ApiSiteModel {
        // Returns a model with all properties undefined
        return new ApiSiteModel();
    }

    /**
     * Create an API site model from JSON data
     */
    public static fromJson(json: any): ApiSiteModel {
        // Ensure json is treated as Partial<ApiSiteSchema>
        return new ApiSiteModel(json as Partial<ApiSiteSchema>);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        json.name = this.name;
        if (this.title !== undefined) { json.title = this.title; }
        if (this.description !== undefined) { json.description = this.description; }
        if (this.versionNumber !== undefined) { json.versionNumber = this.versionNumber; }
        if (this.isPublic !== undefined) { json.isPublic = this.isPublic; }
        if (this.isSiteLoggingEnabled !== undefined) { json.isSiteLoggingEnabled = this.isSiteLoggingEnabled; }
        if (this.apiLogReportName !== undefined) { json.apiLogReportName = this.apiLogReportName; }
        
        // Add array properties only if they are defined
        if (this.apiEnvironment !== undefined && this.apiEnvironment.length > 0) {
            json.apiEnvironment = this.apiEnvironment;
        }
        if (this.apiEndPoint !== undefined && this.apiEndPoint.length > 0) {
            json.apiEndPoint = this.apiEndPoint;
        }
        
        return json;
    }
}