"use strict";
/**
 * Object Workflow Parameter model that represents a parameter in an object workflow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectWorkflowParamModel = void 0;
class ObjectWorkflowParamModel {
    name;
    sqlServerDBDataType;
    sqlServerDBDataTypeSize;
    isFK;
    fKObjectName;
    isFKLookup;
    isFKList;
    isFKListInactiveIncluded;
    fKListOrderBy;
    isFKListSearchable;
    labelText;
    codeDescription;
    defaultValue;
    isVisible;
    isRequired;
    isReadOnly;
    isQueryOnly;
    isQueryStringOnly;
    isHidden;
    isEncrypted;
    isUnknownLookupAllowed;
    inputControl;
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
        if (data?.isFKList !== undefined) {
            this.isFKList = data.isFKList;
        }
        if (data?.isFKListInactiveIncluded !== undefined) {
            this.isFKListInactiveIncluded = data.isFKListInactiveIncluded;
        }
        if (data?.fKListOrderBy !== undefined) {
            this.fKListOrderBy = data.fKListOrderBy;
        }
        if (data?.isFKListSearchable !== undefined) {
            this.isFKListSearchable = data.isFKListSearchable;
        }
        if (data?.labelText !== undefined) {
            this.labelText = data.labelText;
        }
        if (data?.codeDescription !== undefined) {
            this.codeDescription = data.codeDescription;
        }
        if (data?.defaultValue !== undefined) {
            this.defaultValue = data.defaultValue;
        }
        if (data?.isVisible !== undefined) {
            this.isVisible = data.isVisible;
        }
        if (data?.isRequired !== undefined) {
            this.isRequired = data.isRequired;
        }
        if (data?.isReadOnly !== undefined) {
            this.isReadOnly = data.isReadOnly;
        }
        if (data?.isQueryOnly !== undefined) {
            this.isQueryOnly = data.isQueryOnly;
        }
        if (data?.isQueryStringOnly !== undefined) {
            this.isQueryStringOnly = data.isQueryStringOnly;
        }
        if (data?.isHidden !== undefined) {
            this.isHidden = data.isHidden;
        }
        if (data?.isEncrypted !== undefined) {
            this.isEncrypted = data.isEncrypted;
        }
        if (data?.isUnknownLookupAllowed !== undefined) {
            this.isUnknownLookupAllowed = data.isUnknownLookupAllowed;
        }
        if (data?.inputControl !== undefined) {
            this.inputControl = data.inputControl;
        }
        if (data?.isIgnored !== undefined) {
            this.isIgnored = data.isIgnored;
        }
    }
    /**
     * Create a new empty object workflow parameter model
     */
    static createEmpty() {
        // Returns a model with all properties undefined
        return new ObjectWorkflowParamModel();
    }
    /**
     * Create an object workflow parameter model from JSON data
     */
    static fromJson(json) {
        // Ensure json is treated as Partial<ObjectWorkflowParamSchema>
        return new ObjectWorkflowParamModel(json);
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
        if (this.isFKList !== undefined) {
            json.isFKList = this.isFKList;
        }
        if (this.isFKListInactiveIncluded !== undefined) {
            json.isFKListInactiveIncluded = this.isFKListInactiveIncluded;
        }
        if (this.fKListOrderBy !== undefined) {
            json.fKListOrderBy = this.fKListOrderBy;
        }
        if (this.isFKListSearchable !== undefined) {
            json.isFKListSearchable = this.isFKListSearchable;
        }
        if (this.labelText !== undefined) {
            json.labelText = this.labelText;
        }
        if (this.codeDescription !== undefined) {
            json.codeDescription = this.codeDescription;
        }
        if (this.defaultValue !== undefined) {
            json.defaultValue = this.defaultValue;
        }
        if (this.isVisible !== undefined) {
            json.isVisible = this.isVisible;
        }
        if (this.isRequired !== undefined) {
            json.isRequired = this.isRequired;
        }
        if (this.isReadOnly !== undefined) {
            json.isReadOnly = this.isReadOnly;
        }
        if (this.isQueryOnly !== undefined) {
            json.isQueryOnly = this.isQueryOnly;
        }
        if (this.isQueryStringOnly !== undefined) {
            json.isQueryStringOnly = this.isQueryStringOnly;
        }
        if (this.isHidden !== undefined) {
            json.isHidden = this.isHidden;
        }
        if (this.isEncrypted !== undefined) {
            json.isEncrypted = this.isEncrypted;
        }
        if (this.isUnknownLookupAllowed !== undefined) {
            json.isUnknownLookupAllowed = this.isUnknownLookupAllowed;
        }
        if (this.inputControl !== undefined) {
            json.inputControl = this.inputControl;
        }
        if (this.isIgnored !== undefined) {
            json.isIgnored = this.isIgnored;
        }
        return json;
    }
}
exports.ObjectWorkflowParamModel = ObjectWorkflowParamModel;
//# sourceMappingURL=objectWorkflowParamModel.js.map