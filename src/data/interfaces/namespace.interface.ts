/**
 * Interface for the Namespace schema structure
 */

import type { ModelFeatureSchema } from './modelFeature.interface';
import type { LexiconItemSchema } from './lexiconItem.interface';
import type { UserStorySchema } from './userStory.interface';
import type { ObjectSchema } from './object.interface';
import type { ApiSiteSchema } from './apiSite.interface';

export interface NamespaceSchema {
    name: string; // Changed: Removed '?' as 'name' is required
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
}