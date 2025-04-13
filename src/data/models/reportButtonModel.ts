/**
 * Report button model that represents a report button in the App DNA schema
 */

import { ReportButtonSchema } from "../interfaces";

export class ReportButtonModel implements ReportButtonSchema {
    buttonType: string;
    isVisible: string;
    isEnabled: string;
    isButtonCallToAction: string;
    isIgnored: string;
    conditionalVisiblePropertyName: string;
    isButtonBadgeVisible: string;
    buttonBadgePropertyName: string;
    buttonTypeDisplayOrder: string;
    buttonText: string;
    buttonName: string;
    destinationContextObjectName: string;
    destinationTargetName: string;
    accessKey: string;

    constructor(data?: Partial<ReportButtonSchema>) {
        this.buttonType = data?.buttonType || "";
        this.isVisible = data?.isVisible || "true";
        this.isEnabled = data?.isEnabled || "true";
        this.isButtonCallToAction = data?.isButtonCallToAction || "false";
        this.isIgnored = data?.isIgnored || "false";
        this.conditionalVisiblePropertyName = data?.conditionalVisiblePropertyName || "";
        this.isButtonBadgeVisible = data?.isButtonBadgeVisible || "false";
        this.buttonBadgePropertyName = data?.buttonBadgePropertyName || "";
        this.buttonTypeDisplayOrder = data?.buttonTypeDisplayOrder || "";
        this.buttonText = data?.buttonText || "";
        this.buttonName = data?.buttonName || "";
        this.destinationContextObjectName = data?.destinationContextObjectName || "";
        this.destinationTargetName = data?.destinationTargetName || "";
        this.accessKey = data?.accessKey || "";
    }

    /**
     * Create a new empty report button model
     */
    public static createEmpty(): ReportButtonModel {
        return new ReportButtonModel();
    }

    /**
     * Create a report button model from JSON data
     */
    public static fromJson(json: any): ReportButtonModel {
        return new ReportButtonModel(json);
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
            isIgnored: this.isIgnored,
            conditionalVisiblePropertyName: this.conditionalVisiblePropertyName,
            isButtonBadgeVisible: this.isButtonBadgeVisible,
            buttonBadgePropertyName: this.buttonBadgePropertyName,
            buttonTypeDisplayOrder: this.buttonTypeDisplayOrder,
            buttonText: this.buttonText,
            buttonName: this.buttonName,
            destinationContextObjectName: this.destinationContextObjectName,
            destinationTargetName: this.destinationTargetName,
            accessKey: this.accessKey
        };
    }
}