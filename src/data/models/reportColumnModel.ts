/**
 * Report column model that represents a report column in the App DNA schema
 */

import { ReportColumnSchema } from "../interfaces";

export class ReportColumnModel implements ReportColumnSchema {
    name: string;
    minWidth: string;
    maxWidth: string;
    sourceLookupObjImplementationObjName: string;
    sourceObjectName: string;
    sourcePropertyName: string;
    dateTimeDisplayFormat: string;
    infoToolTipText: string;
    sqlServerDBDataType: string;
    sqlServerDBDataTypeSize: string;
    isButton: string;
    isButtonCallToAction: string;

    constructor(data?: Partial<ReportColumnSchema>) {
        this.name = data?.name || "";
        this.minWidth = data?.minWidth || "";
        this.maxWidth = data?.maxWidth || "";
        this.sourceLookupObjImplementationObjName = data?.sourceLookupObjImplementationObjName || "";
        this.sourceObjectName = data?.sourceObjectName || "";
        this.sourcePropertyName = data?.sourcePropertyName || "";
        this.dateTimeDisplayFormat = data?.dateTimeDisplayFormat || "MM/dd/yyyy hh:mm:ss tt";
        this.infoToolTipText = data?.infoToolTipText || "";
        this.sqlServerDBDataType = data?.sqlServerDBDataType || "nvarchar";
        this.sqlServerDBDataTypeSize = data?.sqlServerDBDataTypeSize || "100";
        this.isButton = data?.isButton || "false";
        this.isButtonCallToAction = data?.isButtonCallToAction || "false";
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
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            minWidth: this.minWidth,
            maxWidth: this.maxWidth,
            sourceLookupObjImplementationObjName: this.sourceLookupObjImplementationObjName,
            sourceObjectName: this.sourceObjectName,
            sourcePropertyName: this.sourcePropertyName,
            dateTimeDisplayFormat: this.dateTimeDisplayFormat,
            infoToolTipText: this.infoToolTipText,
            sqlServerDBDataType: this.sqlServerDBDataType,
            sqlServerDBDataTypeSize: this.sqlServerDBDataTypeSize,
            isButton: this.isButton,
            isButtonCallToAction: this.isButtonCallToAction
        };
    }
}