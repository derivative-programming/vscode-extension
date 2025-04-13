"use strict";
/**
 * DynaFlow Task model that represents a task in a DynaFlow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynaFlowTaskModel = void 0;
class DynaFlowTaskModel {
    name;
    taskType;
    taskOrder;
    targetObjectName;
    targetObjectWorkflowName;
    sourceParamNames;
    isVisible;
    isIgnored;
    // Add other properties based on the schema
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.taskType !== undefined) {
            this.taskType = data.taskType;
        }
        if (data?.taskOrder !== undefined) {
            this.taskOrder = data.taskOrder;
        }
        if (data?.targetObjectName !== undefined) {
            this.targetObjectName = data.targetObjectName;
        }
        if (data?.targetObjectWorkflowName !== undefined) {
            this.targetObjectWorkflowName = data.targetObjectWorkflowName;
        }
        if (data?.sourceParamNames !== undefined) {
            this.sourceParamNames = data.sourceParamNames;
        }
        if (data?.isVisible !== undefined) {
            this.isVisible = data.isVisible;
        }
        if (data?.isIgnored !== undefined) {
            this.isIgnored = data.isIgnored;
        }
        // Assign other properties based on the schema
    }
    /**
     * Create a new empty DynaFlow task model
     */
    static createEmpty() {
        // Returns a model with all properties undefined
        return new DynaFlowTaskModel();
    }
    /**
     * Create a DynaFlow task model from JSON data
     */
    static fromJson(json) {
        // Ensure json is treated as Partial<DynaFlowTaskSchema>
        return new DynaFlowTaskModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {};
        // Add optional properties only if they are defined
        if (this.name !== undefined) {
            json.name = this.name;
        }
        if (this.taskType !== undefined) {
            json.taskType = this.taskType;
        }
        if (this.taskOrder !== undefined) {
            json.taskOrder = this.taskOrder;
        }
        if (this.targetObjectName !== undefined) {
            json.targetObjectName = this.targetObjectName;
        }
        if (this.targetObjectWorkflowName !== undefined) {
            json.targetObjectWorkflowName = this.targetObjectWorkflowName;
        }
        if (this.sourceParamNames !== undefined) {
            json.sourceParamNames = this.sourceParamNames;
        }
        if (this.isVisible !== undefined) {
            json.isVisible = this.isVisible;
        }
        if (this.isIgnored !== undefined) {
            json.isIgnored = this.isIgnored;
        }
        // Add other properties based on the schema
        return json;
    }
}
exports.DynaFlowTaskModel = DynaFlowTaskModel;
//# sourceMappingURL=dynaFlowTaskModel.js.map