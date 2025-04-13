/**
 * Namespace model object that represents a namespace in the App DNA schema
 */

import { NamespaceSchema, ModelFeatureSchema, LexiconItemSchema, UserStorySchema, ObjectSchema, ApiSiteSchema } from "../interfaces";

export class NamespaceModel implements NamespaceSchema {
    name: string;
    isDynaFlowAvailable: string;
    isModelFeatureConfigUserDBVeiwer: string;
    isModelFeatureConfigUserDBEditor: string;
    favoriteListContextObjectName: string;
    favoriteListDestinationTargetName: string;
    scheduleListContextObjectName: string;
    scheduleListDestinationTargetName: string;
    modelFeature: ModelFeatureSchema[];
    lexicon: LexiconItemSchema[];
    userStory: UserStorySchema[];
    object: ObjectSchema[];
    apiSite: ApiSiteSchema[];

    constructor(data?: Partial<NamespaceSchema>) {
        this.name = data?.name || "";
        this.isDynaFlowAvailable = data?.isDynaFlowAvailable || "false";
        this.isModelFeatureConfigUserDBVeiwer = data?.isModelFeatureConfigUserDBVeiwer || "false";
        this.isModelFeatureConfigUserDBEditor = data?.isModelFeatureConfigUserDBEditor || "false";
        this.favoriteListContextObjectName = data?.favoriteListContextObjectName || "";
        this.favoriteListDestinationTargetName = data?.favoriteListDestinationTargetName || "";
        this.scheduleListContextObjectName = data?.scheduleListContextObjectName || "";
        this.scheduleListDestinationTargetName = data?.scheduleListDestinationTargetName || "";
        this.modelFeature = data?.modelFeature || [];
        this.lexicon = data?.lexicon || [];
        this.userStory = data?.userStory || [];
        this.object = data?.object || [];
        this.apiSite = data?.apiSite || [];
    }

    /**
     * Create a new empty namespace model
     */
    public static createEmpty(): NamespaceModel {
        return new NamespaceModel();
    }

    /**
     * Create a namespace model from JSON data
     */
    public static fromJson(json: any): NamespaceModel {
        return new NamespaceModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            isDynaFlowAvailable: this.isDynaFlowAvailable,
            isModelFeatureConfigUserDBVeiwer: this.isModelFeatureConfigUserDBVeiwer,
            isModelFeatureConfigUserDBEditor: this.isModelFeatureConfigUserDBEditor,
            favoriteListContextObjectName: this.favoriteListContextObjectName,
            favoriteListDestinationTargetName: this.favoriteListDestinationTargetName,
            scheduleListContextObjectName: this.scheduleListContextObjectName,
            scheduleListDestinationTargetName: this.scheduleListDestinationTargetName,
            modelFeature: this.modelFeature,
            lexicon: this.lexicon,
            userStory: this.userStory,
            object: this.object,
            apiSite: this.apiSite
        };
    }
}