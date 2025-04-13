/**
 * User story model object that represents a user story in the App DNA schema
 */

import { UserStorySchema } from "../interfaces";

export class UserStoryModel implements UserStorySchema {
    name?: string;
    storyNumber?: string;
    storyText?: string;
    isIgnored?: string;
    isStoryProcessed?: string;

    constructor(data?: Partial<UserStorySchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.storyNumber !== undefined) { this.storyNumber = data.storyNumber; }
        if (data?.storyText !== undefined) { this.storyText = data.storyText; }
        if (data?.isIgnored !== undefined) { this.isIgnored = data.isIgnored; }
        if (data?.isStoryProcessed !== undefined) { this.isStoryProcessed = data.isStoryProcessed; }
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
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.storyNumber !== undefined) { json.storyNumber = this.storyNumber; }
        if (this.storyText !== undefined) { json.storyText = this.storyText; }
        if (this.isIgnored !== undefined) { json.isIgnored = this.isIgnored; }
        if (this.isStoryProcessed !== undefined) { json.isStoryProcessed = this.isStoryProcessed; }
        
        return json;
    }
}