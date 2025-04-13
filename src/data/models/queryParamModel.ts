/**
 * Query Parameter model that represents a query parameter in the App DNA schema
 */

import { QueryParamSchema } from "../interfaces";

export class QueryParamModel implements QueryParamSchema {
    name?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    isFK?: string;
    fKObjectName?: string;
    isFKLookup?: string;
    defaultValue?: string;
    codeDescription?: string;
    isIgnored?: string;

    constructor(data?: Partial<QueryParamSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.sqlServerDBDataType !== undefined) { this.sqlServerDBDataType = data.sqlServerDBDataType; }
        if (data?.sqlServerDBDataTypeSize !== undefined) { this.sqlServerDBDataTypeSize = data.sqlServerDBDataTypeSize; }
        if (data?.isFK !== undefined) { this.isFK = data.isFK; }
        if (data?.fKObjectName !== undefined) { this.fKObjectName = data.fKObjectName; }
        if (data?.isFKLookup !== undefined) { this.isFKLookup = data.isFKLookup; }
        if (data?.defaultValue !== undefined) { this.defaultValue = data.defaultValue; }
        if (data?.codeDescription !== undefined) { this.codeDescription = data.codeDescription; }
        if (data?.isIgnored !== undefined) { this.isIgnored = data.isIgnored; }
    }

    /**
     * Create a new empty query parameter model
     */
    public static createEmpty(): QueryParamModel {
        // Returns a model with all properties undefined
        return new QueryParamModel();
    }

    /**
     * Create a query parameter model from JSON data
     */
    public static fromJson(json: any): QueryParamModel {
        // Ensure json is treated as Partial<QueryParamSchema>
        return new QueryParamModel(json as Partial<QueryParamSchema>);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.sqlServerDBDataType !== undefined) { json.sqlServerDBDataType = this.sqlServerDBDataType; }
        if (this.sqlServerDBDataTypeSize !== undefined) { json.sqlServerDBDataTypeSize = this.sqlServerDBDataTypeSize; }
        if (this.isFK !== undefined) { json.isFK = this.isFK; }
        if (this.fKObjectName !== undefined) { json.fKObjectName = this.fKObjectName; }
        if (this.isFKLookup !== undefined) { json.isFKLookup = this.isFKLookup; }
        if (this.defaultValue !== undefined) { json.defaultValue = this.defaultValue; }
        if (this.codeDescription !== undefined) { json.codeDescription = this.codeDescription; }
        if (this.isIgnored !== undefined) { json.isIgnored = this.isIgnored; }
        return json;
    }
}