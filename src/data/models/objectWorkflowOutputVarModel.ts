/**
 * Object Workflow Output Variable model that represents an output variable in an object workflow
 */

import { ObjectWorkflowOutputVarSchema } from "../interfaces";

export class ObjectWorkflowOutputVarModel implements ObjectWorkflowOutputVarSchema {
    name: string;
    sqlServerDBDataType: string;
    sqlServerDBDataTypeSize: string;
    defaultValue: string;
    isFK: string;
    fKObjectName: string;
    labelText: string;
    codeDescription: string;
    isSubscribedToProperty: string;
    propertyName: string;
    isVisible: string;
    isIgnored: string;

    constructor(data?: Partial<ObjectWorkflowOutputVarSchema>) {
        this.name = data?.name || "";
        this.sqlServerDBDataType = data?.sqlServerDBDataType || "nvarchar";
        this.sqlServerDBDataTypeSize = data?.sqlServerDBDataTypeSize || "100";
        this.defaultValue = data?.defaultValue || "";
        this.isFK = data?.isFK || "false";
        this.fKObjectName = data?.fKObjectName || "";
        this.labelText = data?.labelText || "";
        this.codeDescription = data?.codeDescription || "";
        this.isSubscribedToProperty = data?.isSubscribedToProperty || "false";
        this.propertyName = data?.propertyName || "";
        this.isVisible = data?.isVisible || "true";
        this.isIgnored = data?.isIgnored || "false";
    }

    /**
     * Create a new empty object workflow output variable model
     */
    public static createEmpty(): ObjectWorkflowOutputVarModel {
        return new ObjectWorkflowOutputVarModel();
    }

    /**
     * Create an object workflow output variable model from JSON data
     */
    public static fromJson(json: any): ObjectWorkflowOutputVarModel {
        return new ObjectWorkflowOutputVarModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            sqlServerDBDataType: this.sqlServerDBDataType,
            sqlServerDBDataTypeSize: this.sqlServerDBDataTypeSize,
            defaultValue: this.defaultValue,
            isFK: this.isFK,
            fKObjectName: this.fKObjectName,
            labelText: this.labelText,
            codeDescription: this.codeDescription,
            isSubscribedToProperty: this.isSubscribedToProperty,
            propertyName: this.propertyName,
            isVisible: this.isVisible,
            isIgnored: this.isIgnored
        };
    }
}