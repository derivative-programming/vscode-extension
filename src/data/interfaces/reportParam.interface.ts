/**
 * Interface for the Report Parameter schema structure
 */

export interface ReportParamSchema {
    name?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    fKObjectName?: string;
    isFK?: string;
    isFKLookup?: string;
    isFKListInactiveIncluded?: string;
    isFKList?: string;
    fKListOrderBy?: string;
    isFKListSearchable?: string;
    labelText?: string;
    targetColumnName?: string;
    codeDescription?: string;
    isUnknownLookupAllowed?: string;
    defaultValue?: string;
    isVisible?: string;
}