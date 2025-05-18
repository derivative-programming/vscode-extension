/**
 * Model feature model object that represents a model feature in the App DNA schema
 */

import { ModelFeatureSchema } from "../interfaces";

export class ModelFeatureModel implements ModelFeatureSchema {
    name?: string;
    version?: string;
    description?: string;
    isCompleted?: string;    constructor(data?: Partial<ModelFeatureSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.version !== undefined) { this.version = data.version; }
        if (data?.description !== undefined) { this.description = data.description; }
        // Only set isCompleted if it's explicitly provided (from existing data)
        // When adding a new model feature, we don't create this property
        // It will be added by the AI processing when needed
        if (data?.isCompleted !== undefined) { this.isCompleted = data.isCompleted; }
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
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.version !== undefined) { json.version = this.version; }
        if (this.description !== undefined) { json.description = this.description; }
        if (this.isCompleted !== undefined) { json.isCompleted = this.isCompleted; }
        
        return json;
    }
}