/**
 * Query parameter model that represents a parameter in a query
 */

import { QueryParamSchema } from "../interfaces";

export class QueryParamModel implements QueryParamSchema {
    name: string;
    sqlServerDBDataType: string;
    sqlServerDBDataTypeSize: string;
    isFK: string;
    fKObjectName: string;
    isFKLookup: string;
    defaultValue: string;
    codeDescription: string;
    isIgnored: string;

    constructor(data?: Partial<QueryParamSchema>) {
        this.name = data?.name || "";
        this.sqlServerDBDataType = data?.sqlServerDBDataType || "nvarchar";
        this.sqlServerDBDataTypeSize = data?.sqlServerDBDataTypeSize || "100";
        this.isFK = data?.isFK || "false";
        this.fKObjectName = data?.fKObjectName || "";
        this.isFKLookup = data?.isFKLookup || "false";
        this.defaultValue = data?.defaultValue || "";
        this.codeDescription = data?.codeDescription || "";
        this.isIgnored = data?.isIgnored || "false";
    }

    /**
     * Create a new empty query parameter model
     */
    public static createEmpty(): QueryParamModel {
        return new QueryParamModel();
    }

    /**
     * Create a query parameter model from JSON data
     */
    public static fromJson(json: any): QueryParamModel {
        return new QueryParamModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            sqlServerDBDataType: this.sqlServerDBDataType,
            sqlServerDBDataTypeSize: this.sqlServerDBDataTypeSize,
            isFK: this.isFK,
            fKObjectName: this.fKObjectName,
            isFKLookup: this.isFKLookup,
            defaultValue: this.defaultValue,
            codeDescription: this.codeDescription,
            isIgnored: this.isIgnored
        };
    }
}