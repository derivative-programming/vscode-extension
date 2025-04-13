/**
 * Interface for the Report Column schema structure
 */

export interface ReportColumnSchema {
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
}