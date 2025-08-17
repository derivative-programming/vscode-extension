/**
 * Object Workflow Output Variable model that represents an output variable in an object workflow
 */

import { ObjectWorkflowOutputVarSchema } from "../interfaces";

export class ObjectWorkflowOutputVarModel implements ObjectWorkflowOutputVarSchema {
    name?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    labelText?: string;
    buttonText?: string;
    buttonNavURL?: string;
    isLabelVisible?: string;
    defaultValue?: string;
    isLink?: string;
    isAutoRedirectURL?: string;
    buttonObjectWFName?: string;
    conditionalVisiblePropertyName?: string;
    isFK?: string;
    fKObjectName?: string;
    isFKLookup?: string;
    isHeaderText?: string;
    isVisible?: string;
    isIgnored?: string;
    sourceObjectName?: string;
    sourcePropertyName?: string;

    constructor(data?: Partial<ObjectWorkflowOutputVarSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.sqlServerDBDataType !== undefined) { this.sqlServerDBDataType = data.sqlServerDBDataType; }
        if (data?.sqlServerDBDataTypeSize !== undefined) { this.sqlServerDBDataTypeSize = data.sqlServerDBDataTypeSize; }
    if (data?.labelText !== undefined) { this.labelText = data.labelText; }
    if (data?.buttonText !== undefined) { this.buttonText = data.buttonText; }
    if (data?.buttonNavURL !== undefined) { this.buttonNavURL = data.buttonNavURL; }
    if (data?.isLabelVisible !== undefined) { this.isLabelVisible = data.isLabelVisible; }
    if (data?.defaultValue !== undefined) { this.defaultValue = data.defaultValue; }
    if (data?.isLink !== undefined) { this.isLink = data.isLink; }
    if (data?.isAutoRedirectURL !== undefined) { this.isAutoRedirectURL = data.isAutoRedirectURL; }
    if (data?.buttonObjectWFName !== undefined) { this.buttonObjectWFName = data.buttonObjectWFName; }
    if (data?.conditionalVisiblePropertyName !== undefined) { this.conditionalVisiblePropertyName = data.conditionalVisiblePropertyName; }
    if (data?.isVisible !== undefined) { this.isVisible = data.isVisible; }
    if (data?.isFK !== undefined) { this.isFK = data.isFK; }
    if (data?.fKObjectName !== undefined) { this.fKObjectName = data.fKObjectName; }
    if (data?.isFKLookup !== undefined) { this.isFKLookup = data.isFKLookup; }
    if (data?.isHeaderText !== undefined) { this.isHeaderText = data.isHeaderText; }
    if (data?.isIgnored !== undefined) { this.isIgnored = data.isIgnored; }
    if (data?.sourceObjectName !== undefined) { this.sourceObjectName = data.sourceObjectName; }
    if (data?.sourcePropertyName !== undefined) { this.sourcePropertyName = data.sourcePropertyName; }
    }

    /**
     * Create a new empty object workflow output variable model
     */
    public static createEmpty(): ObjectWorkflowOutputVarModel {
        // Returns a model with all properties undefined
        return new ObjectWorkflowOutputVarModel();
    }

    /**
     * Create an object workflow output variable model from JSON data
     */
    public static fromJson(json: any): ObjectWorkflowOutputVarModel {
        // Ensure json is treated as Partial<ObjectWorkflowOutputVarSchema>
        return new ObjectWorkflowOutputVarModel(json as Partial<ObjectWorkflowOutputVarSchema>);
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
    if (this.labelText !== undefined) { json.labelText = this.labelText; }
    if (this.buttonText !== undefined) { json.buttonText = this.buttonText; }
    if (this.buttonNavURL !== undefined) { json.buttonNavURL = this.buttonNavURL; }
    if (this.isLabelVisible !== undefined) { json.isLabelVisible = this.isLabelVisible; }
    if (this.defaultValue !== undefined) { json.defaultValue = this.defaultValue; }
    if (this.isLink !== undefined) { json.isLink = this.isLink; }
    if (this.isAutoRedirectURL !== undefined) { json.isAutoRedirectURL = this.isAutoRedirectURL; }
    if (this.buttonObjectWFName !== undefined) { json.buttonObjectWFName = this.buttonObjectWFName; }
    if (this.conditionalVisiblePropertyName !== undefined) { json.conditionalVisiblePropertyName = this.conditionalVisiblePropertyName; }
    if (this.isVisible !== undefined) { json.isVisible = this.isVisible; }
    if (this.isFK !== undefined) { json.isFK = this.isFK; }
    if (this.fKObjectName !== undefined) { json.fKObjectName = this.fKObjectName; }
    if (this.isFKLookup !== undefined) { json.isFKLookup = this.isFKLookup; }
    if (this.isHeaderText !== undefined) { json.isHeaderText = this.isHeaderText; }
    if (this.isIgnored !== undefined) { json.isIgnored = this.isIgnored; }
    if (this.sourceObjectName !== undefined) { json.sourceObjectName = this.sourceObjectName; }
    if (this.sourcePropertyName !== undefined) { json.sourcePropertyName = this.sourcePropertyName; }
        return json;
    }
}