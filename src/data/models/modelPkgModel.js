"use strict";
/**
 * Model package model object that represents a model package in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelPkgModel = void 0;
class ModelPkgModel {
    isImported;
    isSubscriptionAllowed;
    isSubscribed;
    role;
    name;
    pkgType;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.isImported !== undefined) {
            this.isImported = data.isImported;
        }
        if (data?.isSubscriptionAllowed !== undefined) {
            this.isSubscriptionAllowed = data.isSubscriptionAllowed;
        }
        if (data?.isSubscribed !== undefined) {
            this.isSubscribed = data.isSubscribed;
        }
        if (data?.role !== undefined) {
            this.role = data.role;
        }
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.pkgType !== undefined) {
            this.pkgType = data.pkgType;
        }
    }
    /**
     * Create a new empty model package model
     */
    static createEmpty() {
        return new ModelPkgModel();
    }
    /**
     * Create a model package model from JSON data
     */
    static fromJson(json) {
        return new ModelPkgModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {};
        // Add optional properties only if they are defined
        if (this.isImported !== undefined) {
            json.isImported = this.isImported;
        }
        if (this.isSubscriptionAllowed !== undefined) {
            json.isSubscriptionAllowed = this.isSubscriptionAllowed;
        }
        if (this.isSubscribed !== undefined) {
            json.isSubscribed = this.isSubscribed;
        }
        if (this.role !== undefined) {
            json.role = this.role;
        }
        if (this.name !== undefined) {
            json.name = this.name;
        }
        if (this.pkgType !== undefined) {
            json.pkgType = this.pkgType;
        }
        return json;
    }
}
exports.ModelPkgModel = ModelPkgModel;
//# sourceMappingURL=modelPkgModel.js.map