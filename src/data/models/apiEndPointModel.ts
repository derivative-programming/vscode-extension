/**
 * API endpoint model that represents an API endpoint in the App DNA schema
 */

import { ApiEndPointSchema } from "../interfaces";

export class ApiEndPointModel implements ApiEndPointSchema {
    name?: string;
    isAPIAuthorizationRequired?: string;
    isGetAvailable?: string;
    isGetContextCodeAParam?: string;
    GetContextCodeParamName?: string;
    isGetWithIdAvailable?: string;
    isGetToCsvAvailable?: string;
    isGetInitAvailable?: string;
    isPostAvailable?: string;
    isPostWithIdAvailable?: string;
    isPostWithIdResultFileStreamedOutAvailable?: string;
    isPublic?: string;
    isLazyPost?: string;
    isPutAvailable?: string;
    isDeleteAvailable?: string;
    pluralName?: string;
    description?: string;
    apiContextTargetName?: string;
    apiCodeParamName?: string;
    apiContextObjectName?: string;
    apiPostContextObjectName?: string;
    apiGetInitContextTargetName?: string;
    apiGetInitContextObjectName?: string;
    apiPostContextTargetName?: string;
    apiPostWithIdResultFilePathParamName?: string;
    apiPutContextObjectName?: string;
    apiPutContextTargetName?: string;
    apiDeleteContextObjectName?: string;
    apiDeleteContextTargetName?: string;
    isEndPointLoggingEnabled?: string;
    isIgnored?: string;

    constructor(data?: Partial<ApiEndPointSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.isAPIAuthorizationRequired !== undefined) { this.isAPIAuthorizationRequired = data.isAPIAuthorizationRequired; }
        if (data?.isGetAvailable !== undefined) { this.isGetAvailable = data.isGetAvailable; }
        if (data?.isGetContextCodeAParam !== undefined) { this.isGetContextCodeAParam = data.isGetContextCodeAParam; }
        if (data?.GetContextCodeParamName !== undefined) { this.GetContextCodeParamName = data.GetContextCodeParamName; }
        if (data?.isGetWithIdAvailable !== undefined) { this.isGetWithIdAvailable = data.isGetWithIdAvailable; }
        if (data?.isGetToCsvAvailable !== undefined) { this.isGetToCsvAvailable = data.isGetToCsvAvailable; }
        if (data?.isGetInitAvailable !== undefined) { this.isGetInitAvailable = data.isGetInitAvailable; }
        if (data?.isPostAvailable !== undefined) { this.isPostAvailable = data.isPostAvailable; }
        if (data?.isPostWithIdAvailable !== undefined) { this.isPostWithIdAvailable = data.isPostWithIdAvailable; }
        if (data?.isPostWithIdResultFileStreamedOutAvailable !== undefined) { this.isPostWithIdResultFileStreamedOutAvailable = data.isPostWithIdResultFileStreamedOutAvailable; }
        if (data?.isPublic !== undefined) { this.isPublic = data.isPublic; }
        if (data?.isLazyPost !== undefined) { this.isLazyPost = data.isLazyPost; }
        if (data?.isPutAvailable !== undefined) { this.isPutAvailable = data.isPutAvailable; }
        if (data?.isDeleteAvailable !== undefined) { this.isDeleteAvailable = data.isDeleteAvailable; }
        if (data?.pluralName !== undefined) { this.pluralName = data.pluralName; }
        if (data?.description !== undefined) { this.description = data.description; }
        if (data?.apiContextTargetName !== undefined) { this.apiContextTargetName = data.apiContextTargetName; }
        if (data?.apiCodeParamName !== undefined) { this.apiCodeParamName = data.apiCodeParamName; }
        if (data?.apiContextObjectName !== undefined) { this.apiContextObjectName = data.apiContextObjectName; }
        if (data?.apiPostContextObjectName !== undefined) { this.apiPostContextObjectName = data.apiPostContextObjectName; }
        if (data?.apiGetInitContextTargetName !== undefined) { this.apiGetInitContextTargetName = data.apiGetInitContextTargetName; }
        if (data?.apiGetInitContextObjectName !== undefined) { this.apiGetInitContextObjectName = data.apiGetInitContextObjectName; }
        if (data?.apiPostContextTargetName !== undefined) { this.apiPostContextTargetName = data.apiPostContextTargetName; }
        if (data?.apiPostWithIdResultFilePathParamName !== undefined) { this.apiPostWithIdResultFilePathParamName = data.apiPostWithIdResultFilePathParamName; }
        if (data?.apiPutContextObjectName !== undefined) { this.apiPutContextObjectName = data.apiPutContextObjectName; }
        if (data?.apiPutContextTargetName !== undefined) { this.apiPutContextTargetName = data.apiPutContextTargetName; }
        if (data?.apiDeleteContextObjectName !== undefined) { this.apiDeleteContextObjectName = data.apiDeleteContextObjectName; }
        if (data?.apiDeleteContextTargetName !== undefined) { this.apiDeleteContextTargetName = data.apiDeleteContextTargetName; }
        if (data?.isEndPointLoggingEnabled !== undefined) { this.isEndPointLoggingEnabled = data.isEndPointLoggingEnabled; }
        if (data?.isIgnored !== undefined) { this.isIgnored = data.isIgnored; }
    }

    /**
     * Create a new empty API endpoint model
     */
    public static createEmpty(): ApiEndPointModel {
        // Returns a model with all properties undefined
        return new ApiEndPointModel();
    }

    /**
     * Create an API endpoint model from JSON data
     */
    public static fromJson(json: any): ApiEndPointModel {
        // Ensure json is treated as Partial<ApiEndPointSchema>
        return new ApiEndPointModel(json as Partial<ApiEndPointSchema>);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.isAPIAuthorizationRequired !== undefined) { json.isAPIAuthorizationRequired = this.isAPIAuthorizationRequired; }
        if (this.isGetAvailable !== undefined) { json.isGetAvailable = this.isGetAvailable; }
        if (this.isGetContextCodeAParam !== undefined) { json.isGetContextCodeAParam = this.isGetContextCodeAParam; }
        if (this.GetContextCodeParamName !== undefined) { json.GetContextCodeParamName = this.GetContextCodeParamName; }
        if (this.isGetWithIdAvailable !== undefined) { json.isGetWithIdAvailable = this.isGetWithIdAvailable; }
        if (this.isGetToCsvAvailable !== undefined) { json.isGetToCsvAvailable = this.isGetToCsvAvailable; }
        if (this.isGetInitAvailable !== undefined) { json.isGetInitAvailable = this.isGetInitAvailable; }
        if (this.isPostAvailable !== undefined) { json.isPostAvailable = this.isPostAvailable; }
        if (this.isPostWithIdAvailable !== undefined) { json.isPostWithIdAvailable = this.isPostWithIdAvailable; }
        if (this.isPostWithIdResultFileStreamedOutAvailable !== undefined) { json.isPostWithIdResultFileStreamedOutAvailable = this.isPostWithIdResultFileStreamedOutAvailable; }
        if (this.isPublic !== undefined) { json.isPublic = this.isPublic; }
        if (this.isLazyPost !== undefined) { json.isLazyPost = this.isLazyPost; }
        if (this.isPutAvailable !== undefined) { json.isPutAvailable = this.isPutAvailable; }
        if (this.isDeleteAvailable !== undefined) { json.isDeleteAvailable = this.isDeleteAvailable; }
        if (this.pluralName !== undefined) { json.pluralName = this.pluralName; }
        if (this.description !== undefined) { json.description = this.description; }
        if (this.apiContextTargetName !== undefined) { json.apiContextTargetName = this.apiContextTargetName; }
        if (this.apiCodeParamName !== undefined) { json.apiCodeParamName = this.apiCodeParamName; }
        if (this.apiContextObjectName !== undefined) { json.apiContextObjectName = this.apiContextObjectName; }
        if (this.apiPostContextObjectName !== undefined) { json.apiPostContextObjectName = this.apiPostContextObjectName; }
        if (this.apiGetInitContextTargetName !== undefined) { json.apiGetInitContextTargetName = this.apiGetInitContextTargetName; }
        if (this.apiGetInitContextObjectName !== undefined) { json.apiGetInitContextObjectName = this.apiGetInitContextObjectName; }
        if (this.apiPostContextTargetName !== undefined) { json.apiPostContextTargetName = this.apiPostContextTargetName; }
        if (this.apiPostWithIdResultFilePathParamName !== undefined) { json.apiPostWithIdResultFilePathParamName = this.apiPostWithIdResultFilePathParamName; }
        if (this.apiPutContextObjectName !== undefined) { json.apiPutContextObjectName = this.apiPutContextObjectName; }
        if (this.apiPutContextTargetName !== undefined) { json.apiPutContextTargetName = this.apiPutContextTargetName; }
        if (this.apiDeleteContextObjectName !== undefined) { json.apiDeleteContextObjectName = this.apiDeleteContextObjectName; }
        if (this.apiDeleteContextTargetName !== undefined) { json.apiDeleteContextTargetName = this.apiDeleteContextTargetName; }
        if (this.isEndPointLoggingEnabled !== undefined) { json.isEndPointLoggingEnabled = this.isEndPointLoggingEnabled; }
        if (this.isIgnored !== undefined) { json.isIgnored = this.isIgnored; }
        
        return json;
    }
}