"use strict";
/**
 * Fetch model that represents a fetch in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchModel = void 0;
class FetchModel {
    name;
    byPropName;
    byObjectName;
    byObjectNamespaceName;
    includeInByObjectNameXMLFunction;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.byPropName !== undefined) {
            this.byPropName = data.byPropName;
        }
        if (data?.byObjectName !== undefined) {
            this.byObjectName = data.byObjectName;
        }
        if (data?.byObjectNamespaceName !== undefined) {
            this.byObjectNamespaceName = data.byObjectNamespaceName;
        }
        if (data?.includeInByObjectNameXMLFunction !== undefined) {
            this.includeInByObjectNameXMLFunction = data.includeInByObjectNameXMLFunction;
        }
    }
    /**
     * Create a new empty fetch model
     */
    static createEmpty() {
        return new FetchModel();
    }
    /**
     * Create a fetch model from JSON data
     */
    static fromJson(json) {
        return new FetchModel(json);
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
        if (this.byPropName !== undefined) {
            json.byPropName = this.byPropName;
        }
        if (this.byObjectName !== undefined) {
            json.byObjectName = this.byObjectName;
        }
        if (this.byObjectNamespaceName !== undefined) {
            json.byObjectNamespaceName = this.byObjectNamespaceName;
        }
        if (this.includeInByObjectNameXMLFunction !== undefined) {
            json.includeInByObjectNameXMLFunction = this.includeInByObjectNameXMLFunction;
        }
        return json;
    }
}
exports.FetchModel = FetchModel;
//# sourceMappingURL=fetchModel.js.map