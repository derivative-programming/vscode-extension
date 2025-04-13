"use strict";
/**
 * Query Parameter model that represents a query parameter in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryParamModel = void 0;
class QueryParamModel {
    name;
    sqlServerDBDataType;
    sqlServerDBDataTypeSize;
    isFK;
    fKObjectName;
    isFKLookup;
    defaultValue;
    codeDescription;
    isIgnored;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.sqlServerDBDataType !== undefined) {
            this.sqlServerDBDataType = data.sqlServerDBDataType;
        }
        if (data?.sqlServerDBDataTypeSize !== undefined) {
            this.sqlServerDBDataTypeSize = data.sqlServerDBDataTypeSize;
        }
        if (data?.isFK !== undefined) {
            this.isFK = data.isFK;
        }
        if (data?.fKObjectName !== undefined) {
            this.fKObjectName = data.fKObjectName;
        }
        if (data?.isFKLookup !== undefined) {
            this.isFKLookup = data.isFKLookup;
        }
        if (data?.defaultValue !== undefined) {
            this.defaultValue = data.defaultValue;
        }
        if (data?.codeDescription !== undefined) {
            this.codeDescription = data.codeDescription;
        }
        if (data?.isIgnored !== undefined) {
            this.isIgnored = data.isIgnored;
        }
    }
    /**
     * Create a new empty query parameter model
     */
    static createEmpty() {
        // Returns a model with all properties undefined
        return new QueryParamModel();
    }
    /**
     * Create a query parameter model from JSON data
     */
    static fromJson(json) {
        // Ensure json is treated as Partial<QueryParamSchema>
        return new QueryParamModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {};
        // Add optional properties only if they are defined
        if (this.name !== undefined) {
            json.name = this.name;
        }
        if (this.sqlServerDBDataType !== undefined) {
            json.sqlServerDBDataType = this.sqlServerDBDataType;
        }
        if (this.sqlServerDBDataTypeSize !== undefined) {
            json.sqlServerDBDataTypeSize = this.sqlServerDBDataTypeSize;
        }
        if (this.isFK !== undefined) {
            json.isFK = this.isFK;
        }
        if (this.fKObjectName !== undefined) {
            json.fKObjectName = this.fKObjectName;
        }
        if (this.isFKLookup !== undefined) {
            json.isFKLookup = this.isFKLookup;
        }
        if (this.defaultValue !== undefined) {
            json.defaultValue = this.defaultValue;
        }
        if (this.codeDescription !== undefined) {
            json.codeDescription = this.codeDescription;
        }
        if (this.isIgnored !== undefined) {
            json.isIgnored = this.isIgnored;
        }
        return json;
    }
}
exports.QueryParamModel = QueryParamModel;
//# sourceMappingURL=queryParamModel.js.map