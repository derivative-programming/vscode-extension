/**
 * Interface for the Namespace schema structure
 */

import { ModelFeatureSchema } from './modelFeature.interface';
import { LexiconItemSchema } from './lexiconItem.interface';
import { UserStorySchema } from './userStory.interface';
import { ObjectSchema } from './object.interface';
import { ApiSiteSchema } from './apiSite.interface';

export interface NamespaceSchema {
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
}