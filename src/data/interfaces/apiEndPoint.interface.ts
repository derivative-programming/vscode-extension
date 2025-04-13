/**
 * Interface for the API Endpoint schema structure
 */

export interface ApiEndPointSchema {
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
}