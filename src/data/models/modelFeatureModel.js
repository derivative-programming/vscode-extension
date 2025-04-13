"use strict";
/**
 * Model feature model object that represents a model feature in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelFeatureModel = void 0;
class ModelFeatureModel {
    name;
    version;
    description;
    isCompleted;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.version !== undefined) {
            this.version = data.version;
        }
        if (data?.description !== undefined) {
            this.description = data.description;
        }
        if (data?.isCompleted !== undefined) {
            this.isCompleted = data.isCompleted;
        }
    }
    /**
     * Create a new empty model feature model
     */
    static createEmpty() {
        return new ModelFeatureModel();
    }
    /**
     * Create a model feature model from JSON data
     */
    static fromJson(json) {
        return new ModelFeatureModel(json);
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
        if (this.version !== undefined) {
            json.version = this.version;
        }
        if (this.description !== undefined) {
            json.description = this.description;
        }
        if (this.isCompleted !== undefined) {
            json.isCompleted = this.isCompleted;
        }
        return json;
    }
}
exports.ModelFeatureModel = ModelFeatureModel;
//# sourceMappingURL=modelFeatureModel.js.map