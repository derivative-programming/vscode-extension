/**
 * Interface for the Query Parameter schema structure
 */

export interface QueryParamSchema {
    name?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    isFK?: string;
    fKObjectName?: string;
    isFKLookup?: string;
    defaultValue?: string;
    codeDescription?: string;
    isIgnored?: string;
}