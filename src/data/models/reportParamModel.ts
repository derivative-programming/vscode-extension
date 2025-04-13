/**
 * Report parameter model that represents a report parameter in the App DNA schema
 */

import { ReportParamSchema } from "../interfaces";

export class ReportParamModel implements ReportParamSchema {
    name: string;
    sqlServerDBDataType: string;
    sqlServerDBDataTypeSize: string;
    fKObjectName: string;
    isFK: string;
    isFKLookup: string;
    isFKListInactiveIncluded: string;
    isFKList: string;
    fKListOrderBy: string;
    isFKListSearchable: string;
    labelText: string;
    targetColumnName: string;
    codeDescription: string;
    isUnknownLookupAllowed: string;
    defaultValue: string;
    isVisible: string;

    constructor(data?: Partial<ReportParamSchema>) {
        this.name = data?.name || "";
        this.sqlServerDBDataType = data?.sqlServerDBDataType || "nvarchar";
        this.sqlServerDBDataTypeSize = data?.sqlServerDBDataTypeSize || "100";
        this.fKObjectName = data?.fKObjectName || "";
        this.isFK = data?.isFK || "false";
        this.isFKLookup = data?.isFKLookup || "false";
        this.isFKListInactiveIncluded = data?.isFKListInactiveIncluded || "false";
        this.isFKList = data?.isFKList || "false";
        this.fKListOrderBy = data?.fKListOrderBy || "NameAsc";
        this.isFKListSearchable = data?.isFKListSearchable || "false";
        this.labelText = data?.labelText || "";
        this.targetColumnName = data?.targetColumnName || "";
        this.codeDescription = data?.codeDescription || "";
        this.isUnknownLookupAllowed = data?.isUnknownLookupAllowed || "false";
        this.defaultValue = data?.defaultValue || "";
        this.isVisible = data?.isVisible || "true";
    }

    /**
     * Create a new empty report parameter model
     */
    public static createEmpty(): ReportParamModel {
        return new ReportParamModel();
    }

    /**
     * Create a report parameter model from JSON data
     */
    public static fromJson(json: any): ReportParamModel {
        return new ReportParamModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            sqlServerDBDataType: this.sqlServerDBDataType,
            sqlServerDBDataTypeSize: this.sqlServerDBDataTypeSize,
            fKObjectName: this.fKObjectName,
            isFK: this.isFK,
            isFKLookup: this.isFKLookup,
            isFKListInactiveIncluded: this.isFKListInactiveIncluded,
            isFKList: this.isFKList,
            fKListOrderBy: this.fKListOrderBy,
            isFKListSearchable: this.isFKListSearchable,
            labelText: this.labelText,
            targetColumnName: this.targetColumnName,
            codeDescription: this.codeDescription,
            isUnknownLookupAllowed: this.isUnknownLookupAllowed,
            defaultValue: this.defaultValue,
            isVisible: this.isVisible
        };
    }
}