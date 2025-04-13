/**
 * DynaFlow task model that represents a task in a DynaFlow
 */

import { DynaFlowTaskSchema } from "../interfaces";

export class DynaFlowTaskModel implements DynaFlowTaskSchema {
    childObjWFName: string;
    childObjWFIsExposed: string;
    codeDescription: string;
    taskTitle: string;
    taskDescription: string;
    isOptional: string;
    isBusinessRuleTask: string;
    isIgnored: string;

    constructor(data?: Partial<DynaFlowTaskSchema>) {
        this.childObjWFName = data?.childObjWFName || "";
        this.childObjWFIsExposed = data?.childObjWFIsExposed || "false";
        this.codeDescription = data?.codeDescription || "";
        this.taskTitle = data?.taskTitle || "";
        this.taskDescription = data?.taskDescription || "";
        this.isOptional = data?.isOptional || "false";
        this.isBusinessRuleTask = data?.isBusinessRuleTask || "false";
        this.isIgnored = data?.isIgnored || "false";
    }

    /**
     * Create a new empty DynaFlow task model
     */
    public static createEmpty(): DynaFlowTaskModel {
        return new DynaFlowTaskModel();
    }

    /**
     * Create a DynaFlow task model from JSON data
     */
    public static fromJson(json: any): DynaFlowTaskModel {
        return new DynaFlowTaskModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            childObjWFName: this.childObjWFName,
            childObjWFIsExposed: this.childObjWFIsExposed,
            codeDescription: this.codeDescription,
            taskTitle: this.taskTitle,
            taskDescription: this.taskDescription,
            isOptional: this.isOptional,
            isBusinessRuleTask: this.isBusinessRuleTask,
            isIgnored: this.isIgnored
        };
    }
}