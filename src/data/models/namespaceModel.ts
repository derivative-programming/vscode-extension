/**
 * Namespace model object that represents a namespace in the App DNA schema
 */

import { NamespaceSchema, ModelFeatureSchema, LexiconItemSchema, UserStorySchema, ObjectSchema, ApiSiteSchema } from "../interfaces";

export class NamespaceModel implements NamespaceSchema {
    name: string; // Required property - removed optional ? modifier
    isDynaFlowAvailable?: string;
    isModelFeatureConfigUserDBVeiwer?: string;
    isModelFeatureConfigUserDBEditor?: string;
    favoriteListContextObjectName?: string;
    favoriteListDestinationTargetName?: string;
    scheduleListContextObjectName?: string;
    scheduleListDestinationTargetName?: string;
    modelFeature?: ModelFeatureSchema[];
    lexicon?: LexiconItemSchema[];
    userStory?: UserStorySchema[];
    object?: ObjectSchema[];
    apiSite?: ApiSiteSchema[];

    constructor(data?: Partial<NamespaceSchema>) {
        // Required property initialization
        this.name = data?.name || ""; // Set default empty string if not provided

        // Optional properties are only assigned if they exist in data
        if (data?.isDynaFlowAvailable !== undefined) { this.isDynaFlowAvailable = data.isDynaFlowAvailable; }
        if (data?.isModelFeatureConfigUserDBVeiwer !== undefined) { this.isModelFeatureConfigUserDBVeiwer = data.isModelFeatureConfigUserDBVeiwer; }
        if (data?.isModelFeatureConfigUserDBEditor !== undefined) { this.isModelFeatureConfigUserDBEditor = data.isModelFeatureConfigUserDBEditor; }
        if (data?.favoriteListContextObjectName !== undefined) { this.favoriteListContextObjectName = data.favoriteListContextObjectName; }
        if (data?.favoriteListDestinationTargetName !== undefined) { this.favoriteListDestinationTargetName = data.favoriteListDestinationTargetName; }
        if (data?.scheduleListContextObjectName !== undefined) { this.scheduleListContextObjectName = data.scheduleListContextObjectName; }
        if (data?.scheduleListDestinationTargetName !== undefined) { this.scheduleListDestinationTargetName = data.scheduleListDestinationTargetName; }
        if (data?.modelFeature !== undefined) { this.modelFeature = data.modelFeature; }
        if (data?.lexicon !== undefined) { this.lexicon = data.lexicon; }
        if (data?.userStory !== undefined) { this.userStory = data.userStory; }
        if (data?.object !== undefined) { this.object = data.object; }
        if (data?.apiSite !== undefined) { this.apiSite = data.apiSite; }
    }

    /**
     * Create a new empty namespace model
     */
    public static createEmpty(): NamespaceModel {
        return new NamespaceModel({ name: "" }); // Initialize with required property
    }

    /**
     * Create a namespace model from JSON data
     */
    public static fromJson(json: any): NamespaceModel {
        return new NamespaceModel(json);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {
            name: this.name // Always include required property
        };
        
        // Add optional properties only if they are defined
        if (this.isDynaFlowAvailable !== undefined) { json.isDynaFlowAvailable = this.isDynaFlowAvailable; }
        if (this.isModelFeatureConfigUserDBVeiwer !== undefined) { json.isModelFeatureConfigUserDBVeiwer = this.isModelFeatureConfigUserDBVeiwer; }
        if (this.isModelFeatureConfigUserDBEditor !== undefined) { json.isModelFeatureConfigUserDBEditor = this.isModelFeatureConfigUserDBEditor; }
        if (this.favoriteListContextObjectName !== undefined) { json.favoriteListContextObjectName = this.favoriteListContextObjectName; }
        if (this.favoriteListDestinationTargetName !== undefined) { json.favoriteListDestinationTargetName = this.favoriteListDestinationTargetName; }
        if (this.scheduleListContextObjectName !== undefined) { json.scheduleListContextObjectName = this.scheduleListContextObjectName; }
        if (this.scheduleListDestinationTargetName !== undefined) { json.scheduleListDestinationTargetName = this.scheduleListDestinationTargetName; }
        
        // Add array properties only if they are defined
        if (this.modelFeature !== undefined && this.modelFeature.length > 0) {
            json.modelFeature = this.modelFeature;
        }
        if (this.lexicon !== undefined && this.lexicon.length > 0) {
            json.lexicon = this.lexicon;
        }
        if (this.userStory !== undefined && this.userStory.length > 0) {
            json.userStory = this.userStory;
        }
        if (this.object !== undefined && this.object.length > 0) {
            json.object = this.object;
        }
        if (this.apiSite !== undefined && this.apiSite.length > 0) {
            json.apiSite = this.apiSite;
        }
        
        return json;
    }
}