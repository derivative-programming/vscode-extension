/**
 * Interface for the Object Workflow Parameter schema structure
 */

export interface ObjectWorkflowParamSchema {
    name?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    isFK?: string;
    fKObjectName?: string;
    isFKLookup?: string;
    isFKList?: string;
    isFKListInactiveIncluded?: string;
    fKListOrderBy?: string;
    isFKListSearchable?: string;
    labelText?: string;
    codeDescription?: string;
    defaultValue?: string;
    isVisible?: string;
    isRequired?: string;
    isReadOnly?: string;
    isQueryOnly?: string;
    isQueryStringOnly?: string;
    isHidden?: string;
    isEncrypted?: string;
    isUnknownLookupAllowed?: string;
    inputControl?: string;
    isIgnored?: string;
    // Added to support form input control source references per schema
    sourceObjectName?: string;
    sourcePropertyName?: string;
    // Allow forward-compatible optional properties from evolving schema
    [key: string]: any;
}