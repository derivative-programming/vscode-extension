/**
 * Calculated property model that represents a calculated property in the App DNA schema
 */

import { CalculatedPropSchema } from "../interfaces";

export class CalculatedPropModel implements CalculatedPropSchema {
    name?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    codeDescription?: string;

    constructor(data?: Partial<CalculatedPropSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.sqlServerDBDataType !== undefined) { this.sqlServerDBDataType = data.sqlServerDBDataType; }
        if (data?.sqlServerDBDataTypeSize !== undefined) { this.sqlServerDBDataTypeSize = data.sqlServerDBDataTypeSize; }
        if (data?.codeDescription !== undefined) { this.codeDescription = data.codeDescription; }
    }

    /**
     * Create a new empty calculated property model
     */
    public static createEmpty(): CalculatedPropModel {
        // Returns a model with all properties undefined
        return new CalculatedPropModel();
    }

    /**
     * Create a calculated property model from JSON data
     */
    public static fromJson(json: any): CalculatedPropModel {
        // Ensure json is treated as Partial<CalculatedPropSchema>
        return new CalculatedPropModel(json as Partial<CalculatedPropSchema>);
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
        if (this.codeDescription !== undefined) { json.codeDescription = this.codeDescription; }
        
        return json;
    }
}