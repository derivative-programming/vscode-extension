/**
 * API endpoint model that represents an API endpoint in the App DNA schema
 */

import { ApiEndPointSchema } from "../interfaces";

export class ApiEndPointModel implements ApiEndPointSchema {
    name: string;
    isAPIAuthorizationRequired: string;
    isGetAvailable: string;
    isGetContextCodeAParam: string;
    GetContextCodeParamName: string;
    isGetWithIdAvailable: string;
    isGetToCsvAvailable: string;
    isGetInitAvailable: string;
    isPostAvailable: string;
    isPostWithIdAvailable: string;
    isPostWithIdResultFileStreamedOutAvailable: string;
    isPublic: string;
    isLazyPost: string;
    isPutAvailable: string;
    isDeleteAvailable: string;
    pluralName: string;
    description: string;
    apiContextTargetName: string;
    apiCodeParamName: string;
    apiContextObjectName: string;
    apiPostContextObjectName: string;
    apiGetInitContextTargetName: string;
    apiGetInitContextObjectName: string;
    apiPostContextTargetName: string;
    apiPostWithIdResultFilePathParamName: string;
    apiPutContextObjectName: string;
    apiPutContextTargetName: string;
    apiDeleteContextObjectName: string;
    apiDeleteContextTargetName: string;
    isEndPointLoggingEnabled: string;
    isIgnored: string;

    constructor(data?: Partial<ApiEndPointSchema>) {
        this.name = data?.name || "";
        this.isAPIAuthorizationRequired = data?.isAPIAuthorizationRequired || "true";
        this.isGetAvailable = data?.isGetAvailable || "false";
        this.isGetContextCodeAParam = data?.isGetContextCodeAParam || "false";
        this.GetContextCodeParamName = data?.GetContextCodeParamName || "";
        this.isGetWithIdAvailable = data?.isGetWithIdAvailable || "false";
        this.isGetToCsvAvailable = data?.isGetToCsvAvailable || "false";
        this.isGetInitAvailable = data?.isGetInitAvailable || "false";
        this.isPostAvailable = data?.isPostAvailable || "false";
        this.isPostWithIdAvailable = data?.isPostWithIdAvailable || "false";
        this.isPostWithIdResultFileStreamedOutAvailable = data?.isPostWithIdResultFileStreamedOutAvailable || "false";
        this.isPublic = data?.isPublic || "false";
        this.isLazyPost = data?.isLazyPost || "false";
        this.isPutAvailable = data?.isPutAvailable || "false";
        this.isDeleteAvailable = data?.isDeleteAvailable || "false";
        this.pluralName = data?.pluralName || "";
        this.description = data?.description || "";
        this.apiContextTargetName = data?.apiContextTargetName || "";
        this.apiCodeParamName = data?.apiCodeParamName || "";
        this.apiContextObjectName = data?.apiContextObjectName || "";
        this.apiPostContextObjectName = data?.apiPostContextObjectName || "";
        this.apiGetInitContextTargetName = data?.apiGetInitContextTargetName || "";
        this.apiGetInitContextObjectName = data?.apiGetInitContextObjectName || "";
        this.apiPostContextTargetName = data?.apiPostContextTargetName || "";
        this.apiPostWithIdResultFilePathParamName = data?.apiPostWithIdResultFilePathParamName || "";
        this.apiPutContextObjectName = data?.apiPutContextObjectName || "";
        this.apiPutContextTargetName = data?.apiPutContextTargetName || "";
        this.apiDeleteContextObjectName = data?.apiDeleteContextObjectName || "";
        this.apiDeleteContextTargetName = data?.apiDeleteContextTargetName || "";
        this.isEndPointLoggingEnabled = data?.isEndPointLoggingEnabled || "false";
        this.isIgnored = data?.isIgnored || "false";
    }

    /**
     * Create a new empty API endpoint model
     */
    public static createEmpty(): ApiEndPointModel {
        return new ApiEndPointModel();
    }

    /**
     * Create an API endpoint model from JSON data
     */
    public static fromJson(json: any): ApiEndPointModel {
        return new ApiEndPointModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            isAPIAuthorizationRequired: this.isAPIAuthorizationRequired,
            isGetAvailable: this.isGetAvailable,
            isGetContextCodeAParam: this.isGetContextCodeAParam,
            GetContextCodeParamName: this.GetContextCodeParamName,
            isGetWithIdAvailable: this.isGetWithIdAvailable,
            isGetToCsvAvailable: this.isGetToCsvAvailable,
            isGetInitAvailable: this.isGetInitAvailable,
            isPostAvailable: this.isPostAvailable,
            isPostWithIdAvailable: this.isPostWithIdAvailable,
            isPostWithIdResultFileStreamedOutAvailable: this.isPostWithIdResultFileStreamedOutAvailable,
            isPublic: this.isPublic,
            isLazyPost: this.isLazyPost,
            isPutAvailable: this.isPutAvailable,
            isDeleteAvailable: this.isDeleteAvailable,
            pluralName: this.pluralName,
            description: this.description,
            apiContextTargetName: this.apiContextTargetName,
            apiCodeParamName: this.apiCodeParamName,
            apiContextObjectName: this.apiContextObjectName,
            apiPostContextObjectName: this.apiPostContextObjectName,
            apiGetInitContextTargetName: this.apiGetInitContextTargetName,
            apiGetInitContextObjectName: this.apiGetInitContextObjectName,
            apiPostContextTargetName: this.apiPostContextTargetName,
            apiPostWithIdResultFilePathParamName: this.apiPostWithIdResultFilePathParamName,
            apiPutContextObjectName: this.apiPutContextObjectName,
            apiPutContextTargetName: this.apiPutContextTargetName,
            apiDeleteContextObjectName: this.apiDeleteContextObjectName,
            apiDeleteContextTargetName: this.apiDeleteContextTargetName,
            isEndPointLoggingEnabled: this.isEndPointLoggingEnabled,
            isIgnored: this.isIgnored
        };
    }
}