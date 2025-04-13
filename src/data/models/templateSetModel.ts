/**
 * Template set model that represents a template set in the App DNA schema
 */

import { TemplateSetSchema } from "../interfaces";

export class TemplateSetModel implements TemplateSetSchema {
    name?: string;
    title?: string;
    version?: string;
    isDisabled?: string;

    constructor(data?: Partial<TemplateSetSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.title !== undefined) { this.title = data.title; }
        if (data?.version !== undefined) { this.version = data.version; }
        if (data?.isDisabled !== undefined) { this.isDisabled = data.isDisabled; }
    }

    /**
     * Create a new empty template set model
     */
    public static createEmpty(): TemplateSetModel {
        return new TemplateSetModel();
    }

    /**
     * Create a template set model from JSON data
     */
    public static fromJson(json: any): TemplateSetModel {
        return new TemplateSetModel(json);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.title !== undefined) { json.title = this.title; }
        if (this.version !== undefined) { json.version = this.version; }
        if (this.isDisabled !== undefined) { json.isDisabled = this.isDisabled; }
        
        return json;
    }
}