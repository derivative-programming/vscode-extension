"use strict";
/**
 * Property model that represents a property in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropModel = void 0;
class PropModel {
    name;
    sqlServerDBDataType;
    sqlServerDBDataTypeSize;
    isFK;
    isFKNonLookupIncludedInXMLFunction;
    isFKConstraintSuppressed;
    fKObjectName;
    fKObjectPropertyName;
    isFKLookup;
    labelText;
    codeDescription;
    defaultValue;
    isNotPublishedToSubscriptions;
    isEncrypted;
    isQueryByAvailable;
    forceDBColumnIndex;
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
        if (data?.isFKNonLookupIncludedInXMLFunction !== undefined) {
            this.isFKNonLookupIncludedInXMLFunction = data.isFKNonLookupIncludedInXMLFunction;
        }
        if (data?.isFKConstraintSuppressed !== undefined) {
            this.isFKConstraintSuppressed = data.isFKConstraintSuppressed;
        }
        if (data?.fKObjectName !== undefined) {
            this.fKObjectName = data.fKObjectName;
        }
        if (data?.fKObjectPropertyName !== undefined) {
            this.fKObjectPropertyName = data.fKObjectPropertyName;
        }
        if (data?.isFKLookup !== undefined) {
            this.isFKLookup = data.isFKLookup;
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
        if (data?.isNotPublishedToSubscriptions !== undefined) {
            this.isNotPublishedToSubscriptions = data.isNotPublishedToSubscriptions;
        }
        if (data?.isEncrypted !== undefined) {
            this.isEncrypted = data.isEncrypted;
        }
        if (data?.isQueryByAvailable !== undefined) {
            this.isQueryByAvailable = data.isQueryByAvailable;
        }
        if (data?.forceDBColumnIndex !== undefined) {
            this.forceDBColumnIndex = data.forceDBColumnIndex;
        }
    }
    /**
     * Create a new empty property model
     */
    static createEmpty() {
        return new PropModel();
    }
    /**
     * Create a property model from JSON data
     */
    static fromJson(json) {
        return new PropModel(json);
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
        if (this.isFKNonLookupIncludedInXMLFunction !== undefined) {
            json.isFKNonLookupIncludedInXMLFunction = this.isFKNonLookupIncludedInXMLFunction;
        }
        if (this.isFKConstraintSuppressed !== undefined) {
            json.isFKConstraintSuppressed = this.isFKConstraintSuppressed;
        }
        if (this.fKObjectName !== undefined) {
            json.fKObjectName = this.fKObjectName;
        }
        if (this.fKObjectPropertyName !== undefined) {
            json.fKObjectPropertyName = this.fKObjectPropertyName;
        }
        if (this.isFKLookup !== undefined) {
            json.isFKLookup = this.isFKLookup;
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
        if (this.isNotPublishedToSubscriptions !== undefined) {
            json.isNotPublishedToSubscriptions = this.isNotPublishedToSubscriptions;
        }
        if (this.isEncrypted !== undefined) {
            json.isEncrypted = this.isEncrypted;
        }
        if (this.isQueryByAvailable !== undefined) {
            json.isQueryByAvailable = this.isQueryByAvailable;
        }
        if (this.forceDBColumnIndex !== undefined) {
            json.forceDBColumnIndex = this.forceDBColumnIndex;
        }
        return json;
    }
}
exports.PropModel = PropModel;
//# sourceMappingURL=propModel.js.map