/**
 * Intersection object model that represents an intersection object in the App DNA schema
 */

import { IntersectionObjSchema } from "../interfaces";

export class IntersectionObjModel implements IntersectionObjSchema {
    name?: string;
    pairedObj?: string;

    constructor(data?: Partial<IntersectionObjSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.pairedObj !== undefined) { this.pairedObj = data.pairedObj; }
    }

    /**
     * Create a new empty intersection object model
     */
    public static createEmpty(): IntersectionObjModel {
        return new IntersectionObjModel();
    }

    /**
     * Create an intersection object model from JSON data
     */
    public static fromJson(json: any): IntersectionObjModel {
        return new IntersectionObjModel(json);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.pairedObj !== undefined) { json.pairedObj = this.pairedObj; }
        
        return json;
    }
}