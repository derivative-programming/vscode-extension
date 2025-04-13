/**
 * Lexicon item model object that represents a lexicon item in the App DNA schema
 */

import { LexiconItemSchema } from "../interfaces";

export class LexiconItemModel implements LexiconItemSchema {
    name: string;
    internalTextValue: string;
    displayTextValue: string;

    constructor(data?: Partial<LexiconItemSchema>) {
        this.name = data?.name || "";
        this.internalTextValue = data?.internalTextValue || "";
        this.displayTextValue = data?.displayTextValue || "";
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
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            internalTextValue: this.internalTextValue,
            displayTextValue: this.displayTextValue
        };
    }
}