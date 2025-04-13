/**
 * Lookup item model object that represents a lookup item in the App DNA schema
 */

import { LookupItemSchema } from "../interfaces";

export class LookupItemModel implements LookupItemSchema {
    name: string;
    displayName: string;
    description: string;
    isActive: string;
    customIntProp1Value: string;

    constructor(data?: Partial<LookupItemSchema>) {
        this.name = data?.name || "";
        this.displayName = data?.displayName || "";
        this.description = data?.description || "";
        this.isActive = data?.isActive || "true";
        this.customIntProp1Value = data?.customIntProp1Value || "";
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
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            displayName: this.displayName,
            description: this.description,
            isActive: this.isActive,
            customIntProp1Value: this.customIntProp1Value
        };
    }
}