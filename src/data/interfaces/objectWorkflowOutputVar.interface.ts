/**
 * Interface for the Object Workflow Output Variable schema structure
 */

export interface ObjectWorkflowOutputVarSchema {
    name?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    labelText?: string;
    buttonText?: string;
    buttonNavURL?: string;
    isLabelVisible?: string;
    defaultValue?: string; // Schema specifies string (enum of "true" | "false")
    isLink?: string;
    isAutoRedirectURL?: string;
    buttonObjectWFName?: string;
    conditionalVisiblePropertyName?: string;
    isVisible?: string;
    isFK?: string;
    fKObjectName?: string;
    isFKLookup?: string;
    isHeaderText?: string;
    isIgnored?: string;
    sourceObjectName?: string;
    sourcePropertyName?: string;
}