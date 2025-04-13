/**
 * Report column model that represents a report column in the App DNA schema
 */

import { ReportColumnSchema } from "../interfaces";

export class ReportColumnModel implements ReportColumnSchema {
    name?: string;
    minWidth?: string;
    maxWidth?: string;
    sourceLookupObjImplementationObjName?: string;
    sourceObjectName?: string;
    sourcePropertyName?: string;
    dateTimeDisplayFormat?: string;
    infoToolTipText?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    isButton?: string;
    isButtonCallToAction?: string;

    constructor(data?: Partial<ReportColumnSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.minWidth !== undefined) { this.minWidth = data.minWidth; }
        if (data?.maxWidth !== undefined) { this.maxWidth = data.maxWidth; }
        if (data?.sourceLookupObjImplementationObjName !== undefined) { this.sourceLookupObjImplementationObjName = data.sourceLookupObjImplementationObjName; }
        if (data?.sourceObjectName !== undefined) { this.sourceObjectName = data.sourceObjectName; }
        if (data?.sourcePropertyName !== undefined) { this.sourcePropertyName = data.sourcePropertyName; }
        if (data?.dateTimeDisplayFormat !== undefined) { this.dateTimeDisplayFormat = data.dateTimeDisplayFormat; }
        if (data?.infoToolTipText !== undefined) { this.infoToolTipText = data.infoToolTipText; }
        if (data?.sqlServerDBDataType !== undefined) { this.sqlServerDBDataType = data.sqlServerDBDataType; }
        if (data?.sqlServerDBDataTypeSize !== undefined) { this.sqlServerDBDataTypeSize = data.sqlServerDBDataTypeSize; }
        if (data?.isButton !== undefined) { this.isButton = data.isButton; }
        if (data?.isButtonCallToAction !== undefined) { this.isButtonCallToAction = data.isButtonCallToAction; }
    }

    /**
     * Create a new empty report column model
     */
    public static createEmpty(): ReportColumnModel {
        return new ReportColumnModel();
    }

    /**
     * Create a report column model from JSON data
     */
    public static fromJson(json: any): ReportColumnModel {
        return new ReportColumnModel(json);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.minWidth !== undefined) { json.minWidth = this.minWidth; }
        if (this.maxWidth !== undefined) { json.maxWidth = this.maxWidth; }
        if (this.sourceLookupObjImplementationObjName !== undefined) { json.sourceLookupObjImplementationObjName = this.sourceLookupObjImplementationObjName; }
        if (this.sourceObjectName !== undefined) { json.sourceObjectName = this.sourceObjectName; }
        if (this.sourcePropertyName !== undefined) { json.sourcePropertyName = this.sourcePropertyName; }
        if (this.dateTimeDisplayFormat !== undefined) { json.dateTimeDisplayFormat = this.dateTimeDisplayFormat; }
        if (this.infoToolTipText !== undefined) { json.infoToolTipText = this.infoToolTipText; }
        if (this.sqlServerDBDataType !== undefined) { json.sqlServerDBDataType = this.sqlServerDBDataType; }
        if (this.sqlServerDBDataTypeSize !== undefined) { json.sqlServerDBDataTypeSize = this.sqlServerDBDataTypeSize; }
        if (this.isButton !== undefined) { json.isButton = this.isButton; }
        if (this.isButtonCallToAction !== undefined) { json.isButtonCallToAction = this.isButtonCallToAction; }
        
        return json;
    }
}