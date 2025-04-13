/**
 * Child object model that represents a child object in the App DNA schema
 */

import { ChildObjectSchema } from "../interfaces";

export class ChildObjectModel implements ChildObjectSchema {
    name?: string;

    constructor(data?: Partial<ChildObjectSchema>) {
        // Optional property is only assigned if it exists in data
        if (data?.name !== undefined) { this.name = data.name; }
    }

    /**
     * Create a new empty child object model
     */
    public static createEmpty(): ChildObjectModel {
        // Returns a model with all properties undefined
        return new ChildObjectModel();
    }

    /**
     * Create a child object model from JSON data
     */
    public static fromJson(json: any): ChildObjectModel {
        // Ensure json is treated as Partial<ChildObjectSchema>
        return new ChildObjectModel(json as Partial<ChildObjectSchema>);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional property only if it is defined
        if (this.name !== undefined) { json.name = this.name; }
        
        return json;
    }
}