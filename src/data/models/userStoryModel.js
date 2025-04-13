"use strict";
/**
 * User story model object that represents a user story in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStoryModel = void 0;
class UserStoryModel {
    name;
    storyNumber;
    storyText;
    isIgnored;
    isStoryProcessed;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.storyNumber !== undefined) {
            this.storyNumber = data.storyNumber;
        }
        if (data?.storyText !== undefined) {
            this.storyText = data.storyText;
        }
        if (data?.isIgnored !== undefined) {
            this.isIgnored = data.isIgnored;
        }
        if (data?.isStoryProcessed !== undefined) {
            this.isStoryProcessed = data.isStoryProcessed;
        }
    }
    /**
     * Create a new empty user story model
     */
    static createEmpty() {
        return new UserStoryModel();
    }
    /**
     * Create a user story model from JSON data
     */
    static fromJson(json) {
        return new UserStoryModel(json);
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
        if (this.storyNumber !== undefined) {
            json.storyNumber = this.storyNumber;
        }
        if (this.storyText !== undefined) {
            json.storyText = this.storyText;
        }
        if (this.isIgnored !== undefined) {
            json.isIgnored = this.isIgnored;
        }
        if (this.isStoryProcessed !== undefined) {
            json.isStoryProcessed = this.isStoryProcessed;
        }
        return json;
    }
}
exports.UserStoryModel = UserStoryModel;
//# sourceMappingURL=userStoryModel.js.map