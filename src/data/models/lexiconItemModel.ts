/**
 * Lexicon item model object that represents a lexicon item in the App DNA schema
 */

import { LexiconItemSchema } from "../interfaces";

export class LexiconItemModel implements LexiconItemSchema {
    name?: string;
    internalTextValue?: string;
    displayTextValue?: string;

    constructor(data?: Partial<LexiconItemSchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.internalTextValue !== undefined) { this.internalTextValue = data.internalTextValue; }
        if (data?.displayTextValue !== undefined) { this.displayTextValue = data.displayTextValue; }
    }

    /**
     * Create a new empty lexicon item model
     */
    public static createEmpty(): LexiconItemModel {
        return new LexiconItemModel();
    }

    /**
     * Create a lexicon item model from JSON data
     */
    public static fromJson(json: any): LexiconItemModel {
        return new LexiconItemModel(json);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.internalTextValue !== undefined) { json.internalTextValue = this.internalTextValue; }
        if (this.displayTextValue !== undefined) { json.displayTextValue = this.displayTextValue; }
        
        return json;
    }
}