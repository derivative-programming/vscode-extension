/**
 * Object Workflow Button model that represents a button in an object workflow
 */

import { ObjectWorkflowButtonSchema } from "../interfaces";

export class ObjectWorkflowButtonModel implements ObjectWorkflowButtonSchema {
    buttonType?: string;
    isVisible?: string;
    isEnabled?: string;
    isButtonCallToAction?: string;
    conditionalVisiblePropertyName?: string;
    buttonText?: string;
    buttonName?: string;
    destinationContextObjectName?: string;
    destinationTargetName?: string;
    accessKey?: string;
    isIgnored?: string;

    constructor(data?: Partial<ObjectWorkflowButtonSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.buttonType !== undefined) { this.buttonType = data.buttonType; }
        if (data?.isVisible !== undefined) { this.isVisible = data.isVisible; }
        if (data?.isEnabled !== undefined) { this.isEnabled = data.isEnabled; }
        if (data?.isButtonCallToAction !== undefined) { this.isButtonCallToAction = data.isButtonCallToAction; }
        if (data?.conditionalVisiblePropertyName !== undefined) { this.conditionalVisiblePropertyName = data.conditionalVisiblePropertyName; }
        if (data?.buttonText !== undefined) { this.buttonText = data.buttonText; }
        if (data?.buttonName !== undefined) { this.buttonName = data.buttonName; }
        if (data?.destinationContextObjectName !== undefined) { this.destinationContextObjectName = data.destinationContextObjectName; }
        if (data?.destinationTargetName !== undefined) { this.destinationTargetName = data.destinationTargetName; }
        if (data?.accessKey !== undefined) { this.accessKey = data.accessKey; }
        if (data?.isIgnored !== undefined) { this.isIgnored = data.isIgnored; }
    }

    /**
     * Create a new empty object workflow button model
     */
    public static createEmpty(): ObjectWorkflowButtonModel {
        // Returns a model with all properties undefined
        return new ObjectWorkflowButtonModel();
    }

    /**
     * Create an object workflow button model from JSON data
     */
    public static fromJson(json: any): ObjectWorkflowButtonModel {
        // Ensure json is treated as Partial<ObjectWorkflowButtonSchema>
        return new ObjectWorkflowButtonModel(json as Partial<ObjectWorkflowButtonSchema>);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        // Add optional properties only if they are defined
        if (this.buttonType !== undefined) { json.buttonType = this.buttonType; }
        if (this.isVisible !== undefined) { json.isVisible = this.isVisible; }
        if (this.isEnabled !== undefined) { json.isEnabled = this.isEnabled; }
        if (this.isButtonCallToAction !== undefined) { json.isButtonCallToAction = this.isButtonCallToAction; }
        if (this.conditionalVisiblePropertyName !== undefined) { json.conditionalVisiblePropertyName = this.conditionalVisiblePropertyName; }
        if (this.buttonText !== undefined) { json.buttonText = this.buttonText; }
        if (this.buttonName !== undefined) { json.buttonName = this.buttonName; }
        if (this.destinationContextObjectName !== undefined) { this.destinationContextObjectName = this.destinationContextObjectName; }
        if (this.destinationTargetName !== undefined) { this.destinationTargetName = this.destinationTargetName; }
        if (this.accessKey !== undefined) { this.accessKey = this.accessKey; }
        if (this.isIgnored !== undefined) { this.isIgnored = this.isIgnored; }
        return json;
    }
}