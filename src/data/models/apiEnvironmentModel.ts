/**
 * API environment model that represents an API environment in the App DNA schema
 */

import { ApiEnvironmentSchema } from "../interfaces";

export class ApiEnvironmentModel implements ApiEnvironmentSchema {
    name?: string;
    url?: string;
    description?: string;

    constructor(data?: Partial<ApiEnvironmentSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.url !== undefined) { this.url = data.url; }
        if (data?.description !== undefined) { this.description = data.description; }
    }

    /**
     * Create a new empty API environment model
     */
    public static createEmpty(): ApiEnvironmentModel {
        // Returns a model with all properties undefined
        return new ApiEnvironmentModel();
    }

    /**
     * Create an API environment model from JSON data
     */
    public static fromJson(json: any): ApiEnvironmentModel {
        // Ensure json is treated as Partial<ApiEnvironmentSchema>
        return new ApiEnvironmentModel(json as Partial<ApiEnvironmentSchema>);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.url !== undefined) { json.url = this.url; }
        if (this.description !== undefined) { json.description = this.description; }
        
        return json;
    }
}