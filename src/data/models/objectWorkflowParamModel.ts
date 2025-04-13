/**
 * Object Workflow Parameter model that represents a parameter in an object workflow
 */

import { ObjectWorkflowParamSchema } from "../interfaces";

export class ObjectWorkflowParamModel implements ObjectWorkflowParamSchema {
    name: string;
    sqlServerDBDataType: string;
    sqlServerDBDataTypeSize: string;
    isFK: string;
    fKObjectName: string;
    isFKLookup: string;
    isFKList: string;
    isFKListInactiveIncluded: string;
    fKListOrderBy: string;
    isFKListSearchable: string;
    labelText: string;
    codeDescription: string;
    defaultValue: string;
    isVisible: string;
    isRequired: string;
    isReadOnly: string;
    isQueryOnly: string;
    isQueryStringOnly: string;
    isHidden: string;
    isEncrypted: string;
    isUnknownLookupAllowed: string;
    inputControl: string;
    isIgnored: string;

    constructor(data?: Partial<ObjectWorkflowParamSchema>) {
        this.name = data?.name || "";
        this.sqlServerDBDataType = data?.sqlServerDBDataType || "nvarchar";
        this.sqlServerDBDataTypeSize = data?.sqlServerDBDataTypeSize || "100";
        this.isFK = data?.isFK || "false";
        this.fKObjectName = data?.fKObjectName || "";
        this.isFKLookup = data?.isFKLookup || "false";
        this.isFKList = data?.isFKList || "false";
        this.isFKListInactiveIncluded = data?.isFKListInactiveIncluded || "false";
        this.fKListOrderBy = data?.fKListOrderBy || "NameAsc";
        this.isFKListSearchable = data?.isFKListSearchable || "false";
        this.labelText = data?.labelText || "";
        this.codeDescription = data?.codeDescription || "";
        this.defaultValue = data?.defaultValue || "";
        this.isVisible = data?.isVisible || "true";
        this.isRequired = data?.isRequired || "false";
        this.isReadOnly = data?.isReadOnly || "false";
        this.isQueryOnly = data?.isQueryOnly || "false";
        this.isQueryStringOnly = data?.isQueryStringOnly || "false";
        this.isHidden = data?.isHidden || "false";
        this.isEncrypted = data?.isEncrypted || "false";
        this.isUnknownLookupAllowed = data?.isUnknownLookupAllowed || "false";
        this.inputControl = data?.inputControl || "";
        this.isIgnored = data?.isIgnored || "false";
    }

    /**
     * Create a new empty object workflow parameter model
     */
    public static createEmpty(): ObjectWorkflowParamModel {
        return new ObjectWorkflowParamModel();
    }

    /**
     * Create an object workflow parameter model from JSON data
     */
    public static fromJson(json: any): ObjectWorkflowParamModel {
        return new ObjectWorkflowParamModel(json);
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
            isFKList: this.isFKList,
            isFKListInactiveIncluded: this.isFKListInactiveIncluded,
            fKListOrderBy: this.fKListOrderBy,
            isFKListSearchable: this.isFKListSearchable,
            labelText: this.labelText,
            codeDescription: this.codeDescription,
            defaultValue: this.defaultValue,
            isVisible: this.isVisible,
            isRequired: this.isRequired,
            isReadOnly: this.isReadOnly,
            isQueryOnly: this.isQueryOnly,
            isQueryStringOnly: this.isQueryStringOnly,
            isHidden: this.isHidden,
            isEncrypted: this.isEncrypted,
            isUnknownLookupAllowed: this.isUnknownLookupAllowed,
            inputControl: this.inputControl,
            isIgnored: this.isIgnored
        };
    }
}