/**
 * User story model object that represents a user story in the App DNA schema
 */

import { UserStorySchema } from "../interfaces";

export class UserStoryModel implements UserStorySchema {
    name: string;
    storyNumber: string;
    storyText: string;
    isIgnored: string;
    isStoryProcessed: string;

    constructor(data?: Partial<UserStorySchema>) {
        this.name = data?.name || "";
        this.storyNumber = data?.storyNumber || "";
        this.storyText = data?.storyText || "";
        this.isIgnored = data?.isIgnored || "false";
        this.isStoryProcessed = data?.isStoryProcessed || "false";
    }

    /**
     * Create a new empty user story model
     */
    public static createEmpty(): UserStoryModel {
        return new UserStoryModel();
    }

    /**
     * Create a user story model from JSON data
     */
    public static fromJson(json: any): UserStoryModel {
        return new UserStoryModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            storyNumber: this.storyNumber,
            storyText: this.storyText,
            isIgnored: this.isIgnored,
            isStoryProcessed: this.isStoryProcessed
        };
    }
}