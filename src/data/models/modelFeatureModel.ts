/**
 * Model feature model object that represents a model feature in the App DNA schema
 */

import { ModelFeatureSchema } from "../interfaces";

export class ModelFeatureModel implements ModelFeatureSchema {
    name: string;
    version: string;
    description: string;
    isCompleted: string;

    constructor(data?: Partial<ModelFeatureSchema>) {
        this.name = data?.name || "";
        this.version = data?.version || "";
        this.description = data?.description || "";
        this.isCompleted = data?.isCompleted || "false";
    }

    /**
     * Create a new empty model feature model
     */
    public static createEmpty(): ModelFeatureModel {
        return new ModelFeatureModel();
    }

    /**
     * Create a model feature model from JSON data
     */
    public static fromJson(json: any): ModelFeatureModel {
        return new ModelFeatureModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            version: this.version,
            description: this.description,
            isCompleted: this.isCompleted
        };
    }
}