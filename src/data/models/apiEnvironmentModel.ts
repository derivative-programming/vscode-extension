/**
 * API environment model that represents an API environment in the App DNA schema
 */

import { ApiEnvironmentSchema } from "../interfaces";

export class ApiEnvironmentModel implements ApiEnvironmentSchema {
    name: string;
    url: string;
    description: string;

    constructor(data?: Partial<ApiEnvironmentSchema>) {
        this.name = data?.name || "";
        this.url = data?.url || "";
        this.description = data?.description || "";
    }

    /**
     * Create a new empty API environment model
     */
    public static createEmpty(): ApiEnvironmentModel {
        return new ApiEnvironmentModel();
    }

    /**
     * Create an API environment model from JSON data
     */
    public static fromJson(json: any): ApiEnvironmentModel {
        return new ApiEnvironmentModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            url: this.url,
            description: this.description
        };
    }
}