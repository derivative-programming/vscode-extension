/**
 * Child object model that represents a child object in the App DNA schema
 */

import { ChildObjectSchema } from "../interfaces";

export class ChildObjectModel implements ChildObjectSchema {
    name: string;

    constructor(data?: Partial<ChildObjectSchema>) {
        this.name = data?.name || "";
    }

    /**
     * Create a new empty child object model
     */
    public static createEmpty(): ChildObjectModel {
        return new ChildObjectModel();
    }

    /**
     * Create a child object model from JSON data
     */
    public static fromJson(json: any): ChildObjectModel {
        return new ChildObjectModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name
        };
    }
}