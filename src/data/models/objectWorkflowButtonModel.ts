/**
 * Object Workflow Button model that represents a button in an object workflow
 */

import { ObjectWorkflowButtonSchema } from "../interfaces";

export class ObjectWorkflowButtonModel implements ObjectWorkflowButtonSchema {
    buttonType: string;
    isVisible: string;
    isEnabled: string;
    isButtonCallToAction: string;
    conditionalVisiblePropertyName: string;
    isButtonBadgeVisible: string;
    buttonBadgePropertyName: string;
    buttonTypeDisplayOrder: string;
    buttonText: string;
    buttonName: string;
    destinationContextObjectName: string;
    destinationTargetName: string;
    accessKey: string;
    isAccessKeyAvailable: string;
    isIgnored: string;

    constructor(data?: Partial<ObjectWorkflowButtonSchema>) {
        this.buttonType = data?.buttonType || "submit";
        this.isVisible = data?.isVisible || "true";
        this.isEnabled = data?.isEnabled || "true";
        this.isButtonCallToAction = data?.isButtonCallToAction || "false";
        this.conditionalVisiblePropertyName = data?.conditionalVisiblePropertyName || "";
        this.buttonText = data?.buttonText || "";
        this.buttonName = data?.buttonName || "";
        this.destinationContextObjectName = data?.destinationContextObjectName || "";
        this.destinationTargetName = data?.destinationTargetName || "";
        this.accessKey = data?.accessKey || "";
        this.isAccessKeyAvailable = data?.isAccessKeyAvailable || "false";
        this.isIgnored = data?.isIgnored || "false";
    }

    /**
     * Create a new empty object workflow button model
     */
    public static createEmpty(): ObjectWorkflowButtonModel {
        return new ObjectWorkflowButtonModel();
    }

    /**
     * Create an object workflow button model from JSON data
     */
    public static fromJson(json: any): ObjectWorkflowButtonModel {
        return new ObjectWorkflowButtonModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            buttonType: this.buttonType,
            isVisible: this.isVisible,
            isEnabled: this.isEnabled,
            isButtonCallToAction: this.isButtonCallToAction,
            conditionalVisiblePropertyName: this.conditionalVisiblePropertyName,
            isButtonBadgeVisible: this.isButtonBadgeVisible,
            buttonBadgePropertyName: this.buttonBadgePropertyName,
            buttonTypeDisplayOrder: this.buttonTypeDisplayOrder,
            buttonText: this.buttonText,
            buttonName: this.buttonName,
            destinationContextObjectName: this.destinationContextObjectName,
            destinationTargetName: this.destinationTargetName,
            accessKey: this.accessKey,
            isAccessKeyAvailable: this.isAccessKeyAvailable,
            isIgnored: this.isIgnored
        };
    }
}