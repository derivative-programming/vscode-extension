/**
 * API site model that represents an API site in the App DNA schema
 */

import { ApiSiteSchema, ApiEnvironmentSchema, ApiEndPointSchema } from "../interfaces";

export class ApiSiteModel implements ApiSiteSchema {
    name: string;
    title: string;
    description: string;
    versionNumber: string;
    isPublic: string;
    isSiteLoggingEnabled: string;
    apiLogReportName: string;
    apiEnvironment: ApiEnvironmentSchema[];
    apiEndPoint: ApiEndPointSchema[];

    constructor(data?: Partial<ApiSiteSchema>) {
        this.name = data?.name || "";
        this.title = data?.title || "";
        this.description = data?.description || "";
        this.versionNumber = data?.versionNumber || "";
        this.isPublic = data?.isPublic || "false";
        this.isSiteLoggingEnabled = data?.isSiteLoggingEnabled || "false";
        this.apiLogReportName = data?.apiLogReportName || "";
        this.apiEnvironment = data?.apiEnvironment || [];
        this.apiEndPoint = data?.apiEndPoint || [];
    }

    /**
     * Create a new empty API site model
     */
    public static createEmpty(): ApiSiteModel {
        return new ApiSiteModel();
    }

    /**
     * Create an API site model from JSON data
     */
    public static fromJson(json: any): ApiSiteModel {
        return new ApiSiteModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            title: this.title,
            description: this.description,
            versionNumber: this.versionNumber,
            isPublic: this.isPublic,
            isSiteLoggingEnabled: this.isSiteLoggingEnabled,
            apiLogReportName: this.apiLogReportName,
            apiEnvironment: this.apiEnvironment,
            apiEndPoint: this.apiEndPoint
        };
    }
}