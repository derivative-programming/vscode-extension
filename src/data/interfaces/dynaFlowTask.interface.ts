/**
 * Interface for the DynaFlow Task schema structure
 */

export interface DynaFlowTaskSchema {
    childObjWFName?: string;
    childObjWFIsExposed?: string;
    codeDescription?: string;
    taskTitle?: string;
    taskDescription?: string;
    isOptional?: string;
    isBusinessRuleTask?: string;
    isIgnored?: string;
}