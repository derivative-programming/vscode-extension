/**
 * Nav button model that represents a navigation button in the App DNA schema
 */

import { NavButtonSchema } from "../interfaces";

export class NavButtonModel implements NavButtonSchema {
    buttonType: string;
    isVisible: string;
    isEnabled: string;
    isButtonCallToAction: string;
    conditionalVisiblePropertyName: string;
    buttonText: string;
    buttonName: string;
    destinationContextObjectName: string;
    destinationTargetName: string;
    roleRequired: string;

    constructor(data?: Partial<NavButtonSchema>) {
        this.buttonType = data?.buttonType || "primary";
        this.isVisible = data?.isVisible || "true";
        this.isEnabled = data?.isEnabled || "true";
        this.isButtonCallToAction = data?.isButtonCallToAction || "false";
        this.conditionalVisiblePropertyName = data?.conditionalVisiblePropertyName || "";
        this.buttonText = data?.buttonText || "";
        this.buttonName = data?.buttonName || "";
        this.destinationContextObjectName = data?.destinationContextObjectName || "";
        this.destinationTargetName = data?.destinationTargetName || "";
        this.roleRequired = data?.roleRequired || "";
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
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            buttonType: this.buttonType,
            isVisible: this.isVisible,
            isEnabled: this.isEnabled,
            isButtonCallToAction: this.isButtonCallToAction,
            conditionalVisiblePropertyName: this.conditionalVisiblePropertyName,
            buttonText: this.buttonText,
            buttonName: this.buttonName,
            destinationContextObjectName: this.destinationContextObjectName,
            destinationTargetName: this.destinationTargetName,
            roleRequired: this.roleRequired
        };
    }
}