"use strict";
/**
 * Template set model that represents a template set in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateSetModel = void 0;
class TemplateSetModel {
    name;
    title;
    version;
    isDisabled;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.title !== undefined) {
            this.title = data.title;
        }
        if (data?.version !== undefined) {
            this.version = data.version;
        }
        if (data?.isDisabled !== undefined) {
            this.isDisabled = data.isDisabled;
        }
    }
    /**
     * Create a new empty template set model
     */
    static createEmpty() {
        return new TemplateSetModel();
    }
    /**
     * Create a template set model from JSON data
     */
    static fromJson(json) {
        return new TemplateSetModel(json);
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
        if (this.title !== undefined) {
            json.title = this.title;
        }
        if (this.version !== undefined) {
            json.version = this.version;
        }
        if (this.isDisabled !== undefined) {
            json.isDisabled = this.isDisabled;
        }
        return json;
    }
}
exports.TemplateSetModel = TemplateSetModel;
//# sourceMappingURL=templateSetModel.js.map