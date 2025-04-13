"use strict";
/**
 * Report column model that represents a report column in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportColumnModel = void 0;
class ReportColumnModel {
    name;
    minWidth;
    maxWidth;
    sourceLookupObjImplementationObjName;
    sourceObjectName;
    sourcePropertyName;
    dateTimeDisplayFormat;
    infoToolTipText;
    sqlServerDBDataType;
    sqlServerDBDataTypeSize;
    isButton;
    isButtonCallToAction;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.minWidth !== undefined) {
            this.minWidth = data.minWidth;
        }
        if (data?.maxWidth !== undefined) {
            this.maxWidth = data.maxWidth;
        }
        if (data?.sourceLookupObjImplementationObjName !== undefined) {
            this.sourceLookupObjImplementationObjName = data.sourceLookupObjImplementationObjName;
        }
        if (data?.sourceObjectName !== undefined) {
            this.sourceObjectName = data.sourceObjectName;
        }
        if (data?.sourcePropertyName !== undefined) {
            this.sourcePropertyName = data.sourcePropertyName;
        }
        if (data?.dateTimeDisplayFormat !== undefined) {
            this.dateTimeDisplayFormat = data.dateTimeDisplayFormat;
        }
        if (data?.infoToolTipText !== undefined) {
            this.infoToolTipText = data.infoToolTipText;
        }
        if (data?.sqlServerDBDataType !== undefined) {
            this.sqlServerDBDataType = data.sqlServerDBDataType;
        }
        if (data?.sqlServerDBDataTypeSize !== undefined) {
            this.sqlServerDBDataTypeSize = data.sqlServerDBDataTypeSize;
        }
        if (data?.isButton !== undefined) {
            this.isButton = data.isButton;
        }
        if (data?.isButtonCallToAction !== undefined) {
            this.isButtonCallToAction = data.isButtonCallToAction;
        }
    }
    /**
     * Create a new empty report column model
     */
    static createEmpty() {
        return new ReportColumnModel();
    }
    /**
     * Create a report column model from JSON data
     */
    static fromJson(json) {
        return new ReportColumnModel(json);
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
        if (this.minWidth !== undefined) {
            json.minWidth = this.minWidth;
        }
        if (this.maxWidth !== undefined) {
            json.maxWidth = this.maxWidth;
        }
        if (this.sourceLookupObjImplementationObjName !== undefined) {
            json.sourceLookupObjImplementationObjName = this.sourceLookupObjImplementationObjName;
        }
        if (this.sourceObjectName !== undefined) {
            json.sourceObjectName = this.sourceObjectName;
        }
        if (this.sourcePropertyName !== undefined) {
            json.sourcePropertyName = this.sourcePropertyName;
        }
        if (this.dateTimeDisplayFormat !== undefined) {
            json.dateTimeDisplayFormat = this.dateTimeDisplayFormat;
        }
        if (this.infoToolTipText !== undefined) {
            json.infoToolTipText = this.infoToolTipText;
        }
        if (this.sqlServerDBDataType !== undefined) {
            json.sqlServerDBDataType = this.sqlServerDBDataType;
        }
        if (this.sqlServerDBDataTypeSize !== undefined) {
            json.sqlServerDBDataTypeSize = this.sqlServerDBDataTypeSize;
        }
        if (this.isButton !== undefined) {
            json.isButton = this.isButton;
        }
        if (this.isButtonCallToAction !== undefined) {
            json.isButtonCallToAction = this.isButtonCallToAction;
        }
        return json;
    }
}
exports.ReportColumnModel = ReportColumnModel;
//# sourceMappingURL=reportColumnModel.js.map