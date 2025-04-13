"use strict";
/**
 * Calculated property model that represents a calculated property in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatedPropModel = void 0;
class CalculatedPropModel {
    name;
    sqlServerDBDataType;
    sqlServerDBDataTypeSize;
    codeDescription;
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
        if (data?.codeDescription !== undefined) {
            this.codeDescription = data.codeDescription;
        }
    }
    /**
     * Create a new empty calculated property model
     */
    static createEmpty() {
        // Returns a model with all properties undefined
        return new CalculatedPropModel();
    }
    /**
     * Create a calculated property model from JSON data
     */
    static fromJson(json) {
        // Ensure json is treated as Partial<CalculatedPropSchema>
        return new CalculatedPropModel(json);
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
        if (this.codeDescription !== undefined) {
            json.codeDescription = this.codeDescription;
        }
        return json;
    }
}
exports.CalculatedPropModel = CalculatedPropModel;
//# sourceMappingURL=calculatedPropModel.js.map