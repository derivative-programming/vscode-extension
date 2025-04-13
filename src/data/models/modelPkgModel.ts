/**
 * Model package model object that represents a model package in the App DNA schema
 */

import { ModelPkgSchema } from "../interfaces";

export class ModelPkgModel implements ModelPkgSchema {
    isImported: string;
    isSubscriptionAllowed: string;
    isSubscribed: string;
    role: string;
    name: string;
    pkgType: string;

    constructor(data?: Partial<ModelPkgSchema>) {
        this.isImported = data?.isImported || "false";
        this.isSubscriptionAllowed = data?.isSubscriptionAllowed || "false";
        this.isSubscribed = data?.isSubscribed || "false";
        this.role = data?.role || "";
        this.name = data?.name || "";
        this.pkgType = data?.pkgType || "NA";
    }

    /**
     * Create a new empty model package model
     */
    public static createEmpty(): ModelPkgModel {
        return new ModelPkgModel();
    }

    /**
     * Create a model package model from JSON data
     */
    public static fromJson(json: any): ModelPkgModel {
        return new ModelPkgModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            isImported: this.isImported,
            isSubscriptionAllowed: this.isSubscriptionAllowed,
            isSubscribed: this.isSubscribed,
            role: this.role,
            name: this.name,
            pkgType: this.pkgType
        };
    }
}