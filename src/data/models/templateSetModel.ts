/**
 * Template set model that represents a template set in the App DNA schema
 */

import { TemplateSetSchema } from "../interfaces";

export class TemplateSetModel implements TemplateSetSchema {
    name: string;
    title: string;
    version: string;
    isDisabled: string;

    constructor(data?: Partial<TemplateSetSchema>) {
        this.name = data?.name || "";
        this.title = data?.title || "";
        this.version = data?.version || "";
        this.isDisabled = data?.isDisabled || "false";
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
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            title: this.title,
            version: this.version,
            isDisabled: this.isDisabled
        };
    }
}