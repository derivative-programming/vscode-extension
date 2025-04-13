/**
 * Nav button model that represents a navigation button in the App DNA schema
 */

import { NavButtonSchema } from "../interfaces";

export class NavButtonModel implements NavButtonSchema {
    buttonType?: string;
    isVisible?: string;
    isEnabled?: string;
    isButtonCallToAction?: string;
    conditionalVisiblePropertyName?: string;
    buttonText?: string;
    buttonName?: string;
    destinationContextObjectName?: string;
    destinationTargetName?: string;
    roleRequired?: string;

    constructor(data?: Partial<NavButtonSchema>) {
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
        if (data?.roleRequired !== undefined) { this.roleRequired = data.roleRequired; }
    }

    /**
     * Create a new empty nav button model
     */
    public static createEmpty(): NavButtonModel {
        return new NavButtonModel();
    }

    /**
     * Create a nav button model from JSON data
     */
    public static fromJson(json: any): NavButtonModel {
        return new NavButtonModel(json);
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
        if (this.destinationContextObjectName !== undefined) { json.destinationContextObjectName = this.destinationContextObjectName; }
        if (this.destinationTargetName !== undefined) { json.destinationTargetName = this.destinationTargetName; }
        if (this.roleRequired !== undefined) { json.roleRequired = this.roleRequired; }
        
        return json;
    }
}