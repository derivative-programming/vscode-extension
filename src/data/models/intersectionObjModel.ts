/**
 * Intersection object model that represents an intersection object in the App DNA schema
 */

import { IntersectionObjSchema } from "../interfaces";

export class IntersectionObjModel implements IntersectionObjSchema {
    name: string;
    pairedObj: string;

    constructor(data?: Partial<IntersectionObjSchema>) {
        this.name = data?.name || "";
        this.pairedObj = data?.pairedObj || "";
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
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            pairedObj: this.pairedObj
        };
    }
}