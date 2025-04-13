"use strict";
/**
 * Lexicon item model object that represents a lexicon item in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LexiconItemModel = void 0;
class LexiconItemModel {
    name;
    internalTextValue;
    displayTextValue;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.internalTextValue !== undefined) {
            this.internalTextValue = data.internalTextValue;
        }
        if (data?.displayTextValue !== undefined) {
            this.displayTextValue = data.displayTextValue;
        }
    }
    /**
     * Create a new empty lexicon item model
     */
    static createEmpty() {
        return new LexiconItemModel();
    }
    /**
     * Create a lexicon item model from JSON data
     */
    static fromJson(json) {
        return new LexiconItemModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {};
        // Add optional properties only if they are defined
        if (this.name !== undefined) {
            json.name = this.name;
        }
        if (this.internalTextValue !== undefined) {
            json.internalTextValue = this.internalTextValue;
        }
        if (this.displayTextValue !== undefined) {
            json.displayTextValue = this.displayTextValue;
        }
        return json;
    }
}
exports.LexiconItemModel = LexiconItemModel;
//# sourceMappingURL=lexiconItemModel.js.map