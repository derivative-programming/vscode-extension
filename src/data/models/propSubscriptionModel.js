"use strict";
/**
 * Property subscription model that represents a property subscription in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropSubscriptionModel = void 0;
class PropSubscriptionModel {
    destinationContextObjectName;
    destinationTargetName;
    isIgnored;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.destinationContextObjectName !== undefined) {
            this.destinationContextObjectName = data.destinationContextObjectName;
        }
        if (data?.destinationTargetName !== undefined) {
            this.destinationTargetName = data.destinationTargetName;
        }
        if (data?.isIgnored !== undefined) {
            this.isIgnored = data.isIgnored;
        }
    }
    /**
     * Create a new empty property subscription model
     */
    static createEmpty() {
        return new PropSubscriptionModel();
    }
    /**
     * Create a property subscription model from JSON data
     */
    static fromJson(json) {
        return new PropSubscriptionModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {};
        // Add optional properties only if they are defined
        if (this.destinationContextObjectName !== undefined) {
            json.destinationContextObjectName = this.destinationContextObjectName;
        }
        if (this.destinationTargetName !== undefined) {
            json.destinationTargetName = this.destinationTargetName;
        }
        if (this.isIgnored !== undefined) {
            json.isIgnored = this.isIgnored;
        }
        return json;
    }
}
exports.PropSubscriptionModel = PropSubscriptionModel;
//# sourceMappingURL=propSubscriptionModel.js.map