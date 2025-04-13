/**
 * Calculated property model that represents a calculated property in the App DNA schema
 */

import { CalculatedPropSchema } from "../interfaces";

export class CalculatedPropModel implements CalculatedPropSchema {
    name: string;
    sqlServerDBDataType: string;
    sqlServerDBDataTypeSize: string;
    codeDescription: string;

    constructor(data?: Partial<CalculatedPropSchema>) {
        this.name = data?.name || "";
        this.sqlServerDBDataType = data?.sqlServerDBDataType || "nvarchar";
        this.sqlServerDBDataTypeSize = data?.sqlServerDBDataTypeSize || "100";
        this.codeDescription = data?.codeDescription || "";
    }

    /**
     * Create a new empty calculated property model
     */
    public static createEmpty(): CalculatedPropModel {
        return new CalculatedPropModel();
    }

    /**
     * Create a calculated property model from JSON data
     */
    public static fromJson(json: any): CalculatedPropModel {
        return new CalculatedPropModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            sqlServerDBDataType: this.sqlServerDBDataType,
            sqlServerDBDataTypeSize: this.sqlServerDBDataTypeSize,
            codeDescription: this.codeDescription
        };
    }
}