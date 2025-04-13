"use strict";
/**
 * Nav button model that represents a navigation button in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavButtonModel = void 0;
class NavButtonModel {
    buttonType;
    isVisible;
    isEnabled;
    isButtonCallToAction;
    conditionalVisiblePropertyName;
    buttonText;
    buttonName;
    destinationContextObjectName;
    destinationTargetName;
    roleRequired;
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
        if (data?.conditionalVisiblePropertyName !== undefined) {
            this.conditionalVisiblePropertyName = data.conditionalVisiblePropertyName;
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
        if (data?.roleRequired !== undefined) {
            this.roleRequired = data.roleRequired;
        }
    }
    /**
     * Create a new empty nav button model
     */
    static createEmpty() {
        return new NavButtonModel();
    }
    /**
     * Create a nav button model from JSON data
     */
    static fromJson(json) {
        return new NavButtonModel(json);
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
        if (this.conditionalVisiblePropertyName !== undefined) {
            json.conditionalVisiblePropertyName = this.conditionalVisiblePropertyName;
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
        if (this.roleRequired !== undefined) {
            json.roleRequired = this.roleRequired;
        }
        return json;
    }
}
exports.NavButtonModel = NavButtonModel;
//# sourceMappingURL=navButtonModel.js.map