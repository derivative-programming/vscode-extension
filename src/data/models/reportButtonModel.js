"use strict";
/**
 * Report button model that represents a report button in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportButtonModel = void 0;
class ReportButtonModel {
    buttonType;
    isVisible;
    isEnabled;
    isButtonCallToAction;
    isIgnored;
    conditionalVisiblePropertyName;
    isButtonBadgeVisible;
    buttonBadgePropertyName;
    buttonTypeDisplayOrder;
    buttonText;
    buttonName;
    destinationContextObjectName;
    destinationTargetName;
    accessKey;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.buttonType !== undefined) {
            this.buttonType = data.buttonType;
        }
        if (data?.isVisible !== undefined) {
            this.isVisible = data.isVisible;
        }
        if (data?.isEnabled !== undefined) {
            this.isEnabled = data.isEnabled;
        }
        if (data?.isButtonCallToAction !== undefined) {
            this.isButtonCallToAction = data.isButtonCallToAction;
        }
        if (data?.isIgnored !== undefined) {
            this.isIgnored = data.isIgnored;
        }
        if (data?.conditionalVisiblePropertyName !== undefined) {
            this.conditionalVisiblePropertyName = data.conditionalVisiblePropertyName;
        }
        if (data?.isButtonBadgeVisible !== undefined) {
            this.isButtonBadgeVisible = data.isButtonBadgeVisible;
        }
        if (data?.buttonBadgePropertyName !== undefined) {
            this.buttonBadgePropertyName = data.buttonBadgePropertyName;
        }
        if (data?.buttonTypeDisplayOrder !== undefined) {
            this.buttonTypeDisplayOrder = data.buttonTypeDisplayOrder;
        }
        if (data?.buttonText !== undefined) {
            this.buttonText = data.buttonText;
        }
        if (data?.buttonName !== undefined) {
            this.buttonName = data.buttonName;
        }
        if (data?.destinationContextObjectName !== undefined) {
            this.destinationContextObjectName = data.destinationContextObjectName;
        }
        if (data?.destinationTargetName !== undefined) {
            this.destinationTargetName = data.destinationTargetName;
        }
        if (data?.accessKey !== undefined) {
            this.accessKey = data.accessKey;
        }
    }
    /**
     * Create a new empty report button model
     */
    static createEmpty() {
        return new ReportButtonModel();
    }
    /**
     * Create a report button model from JSON data
     */
    static fromJson(json) {
        return new ReportButtonModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {};
        // Add optional properties only if they are defined
        if (this.buttonType !== undefined) {
            json.buttonType = this.buttonType;
        }
        if (this.isVisible !== undefined) {
            json.isVisible = this.isVisible;
        }
        if (this.isEnabled !== undefined) {
            json.isEnabled = this.isEnabled;
        }
        if (this.isButtonCallToAction !== undefined) {
            json.isButtonCallToAction = this.isButtonCallToAction;
        }
        if (this.isIgnored !== undefined) {
            json.isIgnored = this.isIgnored;
        }
        if (this.conditionalVisiblePropertyName !== undefined) {
            json.conditionalVisiblePropertyName = this.conditionalVisiblePropertyName;
        }
        if (this.isButtonBadgeVisible !== undefined) {
            json.isButtonBadgeVisible = this.isButtonBadgeVisible;
        }
        if (this.buttonBadgePropertyName !== undefined) {
            json.buttonBadgePropertyName = this.buttonBadgePropertyName;
        }
        if (this.buttonTypeDisplayOrder !== undefined) {
            json.buttonTypeDisplayOrder = this.buttonTypeDisplayOrder;
        }
        if (this.buttonText !== undefined) {
            json.buttonText = this.buttonText;
        }
        if (this.buttonName !== undefined) {
            json.buttonName = this.buttonName;
        }
        if (this.destinationContextObjectName !== undefined) {
            json.destinationContextObjectName = this.destinationContextObjectName;
        }
        if (this.destinationTargetName !== undefined) {
            json.destinationTargetName = this.destinationTargetName;
        }
        if (this.accessKey !== undefined) {
            json.accessKey = this.accessKey;
        }
        return json;
    }
}
exports.ReportButtonModel = ReportButtonModel;
//# sourceMappingURL=reportButtonModel.js.map