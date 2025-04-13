"use strict";
/**
 * Child object model that represents a child object in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildObjectModel = void 0;
class ChildObjectModel {
    name;
    constructor(data) {
        // Optional property is only assigned if it exists in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
    }
    /**
     * Create a new empty child object model
     */
    static createEmpty() {
        // Returns a model with all properties undefined
        return new ChildObjectModel();
    }
    /**
     * Create a child object model from JSON data
     */
    static fromJson(json) {
        // Ensure json is treated as Partial<ChildObjectSchema>
        return new ChildObjectModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {};
        // Add optional property only if it is defined
        if (this.name !== undefined) {
            json.name = this.name;
        }
        return json;
    }
}
exports.ChildObjectModel = ChildObjectModel;
//# sourceMappingURL=childObjectModel.js.map