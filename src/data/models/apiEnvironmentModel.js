"use strict";
/**
 * API environment model that represents an API environment in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiEnvironmentModel = void 0;
class ApiEnvironmentModel {
    name;
    url;
    description;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.url !== undefined) {
            this.url = data.url;
        }
        if (data?.description !== undefined) {
            this.description = data.description;
        }
    }
    /**
     * Create a new empty API environment model
     */
    static createEmpty() {
        // Returns a model with all properties undefined
        return new ApiEnvironmentModel();
    }
    /**
     * Create an API environment model from JSON data
     */
    static fromJson(json) {
        // Ensure json is treated as Partial<ApiEnvironmentSchema>
        return new ApiEnvironmentModel(json);
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
        if (this.url !== undefined) {
            json.url = this.url;
        }
        if (this.description !== undefined) {
            json.description = this.description;
        }
        return json;
    }
}
exports.ApiEnvironmentModel = ApiEnvironmentModel;
//# sourceMappingURL=apiEnvironmentModel.js.map