"use strict";
/**
 * Intersection object model that represents an intersection object in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntersectionObjModel = void 0;
class IntersectionObjModel {
    name;
    pairedObj;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.pairedObj !== undefined) {
            this.pairedObj = data.pairedObj;
        }
    }
    /**
     * Create a new empty intersection object model
     */
    static createEmpty() {
        return new IntersectionObjModel();
    }
    /**
     * Create an intersection object model from JSON data
     */
    static fromJson(json) {
        return new IntersectionObjModel(json);
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
        if (this.pairedObj !== undefined) {
            json.pairedObj = this.pairedObj;
        }
        return json;
    }
}
exports.IntersectionObjModel = IntersectionObjModel;
//# sourceMappingURL=intersectionObjModel.js.map