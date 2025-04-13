/**
 * Interface for the Object schema structure
 */

import { ModelPkgSchema } from './modelPkg.interface';
import { LookupItemSchema } from './lookupItem.interface';
import { ChildObjectSchema } from './childObject.interface';
import { PropSchema } from './prop.interface';
import { PropSubscriptionSchema } from './propSubscription.interface';
import { CalculatedPropSchema } from './calculatedProp.interface';
import { ReportSchema } from './report.interface';
import { ObjectWorkflowSchema } from './objectWorkflow.interface';
import { FetchSchema } from './fetch.interface';
import { QuerySchema } from './query.interface';
import { IntersectionObjSchema } from './intersectionObj.interface';

export interface ObjectSchema {
    name?: string;
    codeDescription?: string;
    isLookup?: string;
    parentObjectName?: string;
    modelPkg?: ModelPkgSchema[];
    lookupItem?: LookupItemSchema[];
    childObject?: ChildObjectSchema[];
    prop?: PropSchema[];
    propSubscription?: PropSubscriptionSchema[];
    calculatedProp?: CalculatedPropSchema[];
    report?: ReportSchema[];
    objectWorkflow?: ObjectWorkflowSchema[];
    fetch?: FetchSchema[];
    query?: QuerySchema[];
    intersectionObj?: IntersectionObjSchema[];
    isFullResearchDatabaseViewAllowed?: string;
    isNotImplemented?: string;
    isSoftDeleteUsed?: string;
    cacheAllRecs?: string;
    cacheIndividualRecs?: string;
}