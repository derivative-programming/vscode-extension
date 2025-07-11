/**
 * Property subscription model that represents a property subscription in the App DNA schema
 */

import { PropSubscriptionSchema } from "../interfaces";

export class PropSubscriptionModel implements PropSubscriptionSchema {
    destinationContextObjectName?: string;
    destinationTargetName?: string;
    isIgnored?: string;

    constructor(data?: Partial<PropSubscriptionSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.destinationContextObjectName !== undefined) { this.destinationContextObjectName = data.destinationContextObjectName; }
        if (data?.destinationTargetName !== undefined) { this.destinationTargetName = data.destinationTargetName; }
        if (data?.isIgnored !== undefined) { this.isIgnored = data.isIgnored; }
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
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.destinationContextObjectName !== undefined) { json.destinationContextObjectName = this.destinationContextObjectName; }
        if (this.destinationTargetName !== undefined) { json.destinationTargetName = this.destinationTargetName; }
        if (this.isIgnored !== undefined) { json.isIgnored = this.isIgnored; }
        
        return json;
    }
}