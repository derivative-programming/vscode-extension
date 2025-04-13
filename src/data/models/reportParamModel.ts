/**
 * Report parameter model that represents a report parameter in the App DNA schema
 */

import { ReportParamSchema } from "../interfaces";

export class ReportParamModel implements ReportParamSchema {
    name?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    fKObjectName?: string;
    isFK?: string;
    isFKLookup?: string;
    isFKListInactiveIncluded?: string;
    isFKList?: string;
    fKListOrderBy?: string;
    isFKListSearchable?: string;
    labelText?: string;
    targetColumnName?: string;
    codeDescription?: string;
    isUnknownLookupAllowed?: string;
    defaultValue?: string;
    isVisible?: string;

    constructor(data?: Partial<ReportParamSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.sqlServerDBDataType !== undefined) { this.sqlServerDBDataType = data.sqlServerDBDataType; }
        if (data?.sqlServerDBDataTypeSize !== undefined) { this.sqlServerDBDataTypeSize = data.sqlServerDBDataTypeSize; }
        if (data?.fKObjectName !== undefined) { this.fKObjectName = data.fKObjectName; }
        if (data?.isFK !== undefined) { this.isFK = data.isFK; }
        if (data?.isFKLookup !== undefined) { this.isFKLookup = data.isFKLookup; }
        if (data?.isFKListInactiveIncluded !== undefined) { this.isFKListInactiveIncluded = data.isFKListInactiveIncluded; }
        if (data?.isFKList !== undefined) { this.isFKList = data.isFKList; }
        if (data?.fKListOrderBy !== undefined) { this.fKListOrderBy = data.fKListOrderBy; }
        if (data?.isFKListSearchable !== undefined) { this.isFKListSearchable = data.isFKListSearchable; }
        if (data?.labelText !== undefined) { this.labelText = data.labelText; }
        if (data?.targetColumnName !== undefined) { this.targetColumnName = data.targetColumnName; }
        if (data?.codeDescription !== undefined) { this.codeDescription = data.codeDescription; }
        if (data?.isUnknownLookupAllowed !== undefined) { this.isUnknownLookupAllowed = data.isUnknownLookupAllowed; }
        if (data?.defaultValue !== undefined) { this.defaultValue = data.defaultValue; }
        if (data?.isVisible !== undefined) { this.isVisible = data.isVisible; }
    }

    /**
     * Create a new empty report parameter model
     */
    public static createEmpty(): ReportParamModel {
        // Returns a model with all properties undefined
        return new ReportParamModel();
    }

    /**
     * Create a report parameter model from JSON data
     */
    public static fromJson(json: any): ReportParamModel {
        // Ensure json is treated as Partial<ReportParamSchema>
        return new ReportParamModel(json as Partial<ReportParamSchema>);
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
        if (this.fKObjectName !== undefined) { json.fKObjectName = this.fKObjectName; }
        if (this.isFK !== undefined) { json.isFK = this.isFK; }
        if (this.isFKLookup !== undefined) { json.isFKLookup = this.isFKLookup; }
        if (this.isFKListInactiveIncluded !== undefined) { json.isFKListInactiveIncluded = this.isFKListInactiveIncluded; }
        if (this.isFKList !== undefined) { json.isFKList = this.isFKList; }
        if (this.fKListOrderBy !== undefined) { json.fKListOrderBy = this.fKListOrderBy; }
        if (this.isFKListSearchable !== undefined) { json.isFKListSearchable = this.isFKListSearchable; }
        if (this.labelText !== undefined) { json.labelText = this.labelText; }
        if (this.targetColumnName !== undefined) { json.targetColumnName = this.targetColumnName; }
        if (this.codeDescription !== undefined) { json.codeDescription = this.codeDescription; }
        if (this.isUnknownLookupAllowed !== undefined) { json.isUnknownLookupAllowed = this.isUnknownLookupAllowed; }
        if (this.defaultValue !== undefined) { json.defaultValue = this.defaultValue; }
        if (this.isVisible !== undefined) { json.isVisible = this.isVisible; }
        return json;
    }
}