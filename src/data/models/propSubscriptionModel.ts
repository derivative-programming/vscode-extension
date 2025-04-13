/**
 * Property subscription model that represents a property subscription in the App DNA schema
 */

import { PropSubscriptionSchema } from "../interfaces";

export class PropSubscriptionModel implements PropSubscriptionSchema {
    destinationContextObjectName: string;
    destinationTargetName: string;
    isIgnored: string;

    constructor(data?: Partial<PropSubscriptionSchema>) {
        this.destinationContextObjectName = data?.destinationContextObjectName || "";
        this.destinationTargetName = data?.destinationTargetName || "";
        this.isIgnored = data?.isIgnored || "false";
    }

    /**
     * Create a new empty property subscription model
     */
    public static createEmpty(): PropSubscriptionModel {
        return new PropSubscriptionModel();
    }

    /**
     * Create a property subscription model from JSON data
     */
    public static fromJson(json: any): PropSubscriptionModel {
        return new PropSubscriptionModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            destinationContextObjectName: this.destinationContextObjectName,
            destinationTargetName: this.destinationTargetName,
            isIgnored: this.isIgnored
        };
    }
}