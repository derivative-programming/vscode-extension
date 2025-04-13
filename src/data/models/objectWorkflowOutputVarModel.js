"use strict";
/**
 * Object Workflow Output Variable model that represents an output variable in an object workflow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectWorkflowOutputVarModel = void 0;
class ObjectWorkflowOutputVarModel {
    name;
    sqlServerDBDataType;
    sqlServerDBDataTypeSize;
    defaultValue;
    isFK;
    fKObjectName;
    labelText;
    codeDescription;
    isSubscribedToProperty;
    propertyName;
    isVisible;
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
        if (data?.defaultValue !== undefined) {
            this.defaultValue = data.defaultValue;
        }
        if (data?.isFK !== undefined) {
            this.isFK = data.isFK;
        }
        if (data?.fKObjectName !== undefined) {
            this.fKObjectName = data.fKObjectName;
        }
        if (data?.labelText !== undefined) {
            this.labelText = data.labelText;
        }
        if (data?.codeDescription !== undefined) {
            this.codeDescription = data.codeDescription;
        }
        if (data?.isSubscribedToProperty !== undefined) {
            this.isSubscribedToProperty = data.isSubscribedToProperty;
        }
        if (data?.propertyName !== undefined) {
            this.propertyName = data.propertyName;
        }
        if (data?.isVisible !== undefined) {
            this.isVisible = data.isVisible;
        }
        if (data?.isIgnored !== undefined) {
            this.isIgnored = data.isIgnored;
        }
    }
    /**
     * Create a new empty object workflow output variable model
     */
    static createEmpty() {
        // Returns a model with all properties undefined
        return new ObjectWorkflowOutputVarModel();
    }
    /**
     * Create an object workflow output variable model from JSON data
     */
    static fromJson(json) {
        // Ensure json is treated as Partial<ObjectWorkflowOutputVarSchema>
        return new ObjectWorkflowOutputVarModel(json);
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
        if (this.defaultValue !== undefined) {
            json.defaultValue = this.defaultValue;
        }
        if (this.isFK !== undefined) {
            json.isFK = this.isFK;
        }
        if (this.fKObjectName !== undefined) {
            json.fKObjectName = this.fKObjectName;
        }
        if (this.labelText !== undefined) {
            json.labelText = this.labelText;
        }
        if (this.codeDescription !== undefined) {
            json.codeDescription = this.codeDescription;
        }
        if (this.isSubscribedToProperty !== undefined) {
            json.isSubscribedToProperty = this.isSubscribedToProperty;
        }
        if (this.propertyName !== undefined) {
            json.propertyName = this.propertyName;
        }
        if (this.isVisible !== undefined) {
            json.isVisible = this.isVisible;
        }
        if (this.isIgnored !== undefined) {
            json.isIgnored = this.isIgnored;
        }
        return json;
    }
}
exports.ObjectWorkflowOutputVarModel = ObjectWorkflowOutputVarModel;
//# sourceMappingURL=objectWorkflowOutputVarModel.js.map