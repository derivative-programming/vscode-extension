/**
 * Lookup item model object that represents a lookup item in the App DNA schema
 */

import { LookupItemSchema } from "../interfaces";

export class LookupItemModel implements LookupItemSchema {
    name?: string;
    displayName?: string;
    description?: string;
    isActive?: string;
    customIntProp1Value?: string;

    constructor(data?: Partial<LookupItemSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.displayName !== undefined) { this.displayName = data.displayName; }
        if (data?.description !== undefined) { this.description = data.description; }
        if (data?.isActive !== undefined) { this.isActive = data.isActive; }
        if (data?.customIntProp1Value !== undefined) { this.customIntProp1Value = data.customIntProp1Value; }
    }

    /**
     * Create a new empty lookup item model
     */
    public static createEmpty(): LookupItemModel {
        return new LookupItemModel();
    }

    /**
     * Create a lookup item model from JSON data
     */
    public static fromJson(json: any): LookupItemModel {
        return new LookupItemModel(json);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.displayName !== undefined) { json.displayName = this.displayName; }
        if (this.description !== undefined) { json.description = this.description; }
        if (this.isActive !== undefined) { json.isActive = this.isActive; }
        if (this.customIntProp1Value !== undefined) { json.customIntProp1Value = this.customIntProp1Value; }
        
        return json;
    }
}