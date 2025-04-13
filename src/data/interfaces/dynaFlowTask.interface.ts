/**
 * Interface for the DynaFlow Task schema structure
 */

export interface DynaFlowTaskSchema {
    name?: string;
    taskType?: string;
    taskOrder?: string;
    targetObjectName?: string;
    targetObjectWorkflowName?: string;
    sourceParamNames?: string;
    isVisible?: string;
    isIgnored?: string;
    // Add other properties based on schema requirements
}