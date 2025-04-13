/**
 * Interface for the Object Workflow Output Variable schema structure
 */

export interface ObjectWorkflowOutputVarSchema {
    name?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    isFK?: string;
    fKObjectName?: string;
    labelText?: string;
    codeDescription?: string;
    defaultValue?: string;
    isSubscribedToProperty?: string;
    propertyName?: string;
    isVisible?: string;
    isIgnored?: string;
}