"use strict";
/**
 * Lookup item model object that represents a lookup item in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LookupItemModel = void 0;
class LookupItemModel {
    name;
    displayName;
    description;
    isActive;
    customIntProp1Value;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.displayName !== undefined) {
            this.displayName = data.displayName;
        }
        if (data?.description !== undefined) {
            this.description = data.description;
        }
        if (data?.isActive !== undefined) {
            this.isActive = data.isActive;
        }
        if (data?.customIntProp1Value !== undefined) {
            this.customIntProp1Value = data.customIntProp1Value;
        }
    }
    /**
     * Create a new empty lookup item model
     */
    static createEmpty() {
        return new LookupItemModel();
    }
    /**
     * Create a lookup item model from JSON data
     */
    static fromJson(json) {
        return new LookupItemModel(json);
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
        if (this.displayName !== undefined) {
            json.displayName = this.displayName;
        }
        if (this.description !== undefined) {
            json.description = this.description;
        }
        if (this.isActive !== undefined) {
            json.isActive = this.isActive;
        }
        if (this.customIntProp1Value !== undefined) {
            json.customIntProp1Value = this.customIntProp1Value;
        }
        return json;
    }
}
exports.LookupItemModel = LookupItemModel;
//# sourceMappingURL=lookupItemModel.js.map