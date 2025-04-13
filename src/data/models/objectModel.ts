/**
 * Object model that represents an object in the App DNA schema
 */

import { 
    ObjectSchema, 
    ModelPkgSchema, 
    LookupItemSchema, 
    ChildObjectSchema,
    PropSchema,
    PropSubscriptionSchema,
    CalculatedPropSchema,
    ReportSchema,
    ObjectWorkflowSchema,
    FetchSchema,
    QuerySchema,
    IntersectionObjSchema
} from "../interfaces";

export class ObjectModel implements ObjectSchema {
    name: string;
    codeDescription: string;
    isLookup: string;
    parentObjectName: string;
    modelPkg: ModelPkgSchema[];
    lookupItem: LookupItemSchema[];
    childObject: ChildObjectSchema[];
    prop: PropSchema[];
    propSubscription: PropSubscriptionSchema[];
    calculatedProp: CalculatedPropSchema[];
    report: ReportSchema[];
    objectWorkflow: ObjectWorkflowSchema[];
    fetch: FetchSchema[];
    query: QuerySchema[];
    intersectionObj: IntersectionObjSchema[];
    isFullResearchDatabaseViewAllowed: string;
    isNotImplemented: string;
    isSoftDeleteUsed: string;
    cacheAllRecs: string;
    cacheIndividualRecs: string;

    constructor(data?: Partial<ObjectSchema>) {
        this.name = data?.name || "";
        this.codeDescription = data?.codeDescription || "";
        this.isLookup = data?.isLookup || "false";
        this.parentObjectName = data?.parentObjectName || "";
        this.modelPkg = data?.modelPkg || [];
        this.lookupItem = data?.lookupItem || [];
        this.childObject = data?.childObject || [];
        this.prop = data?.prop || [];
        this.propSubscription = data?.propSubscription || [];
        this.calculatedProp = data?.calculatedProp || [];
        this.report = data?.report || [];
        this.objectWorkflow = data?.objectWorkflow || [];
        this.fetch = data?.fetch || [];
        this.query = data?.query || [];
        this.intersectionObj = data?.intersectionObj || [];
        this.isFullResearchDatabaseViewAllowed = data?.isFullResearchDatabaseViewAllowed || "false";
        this.isNotImplemented = data?.isNotImplemented || "false";
        this.isSoftDeleteUsed = data?.isSoftDeleteUsed || "false";
        this.cacheAllRecs = data?.cacheAllRecs || "false";
        this.cacheIndividualRecs = data?.cacheIndividualRecs || "false";
    }

    /**
     * Create a new empty object model
     */
    public static createEmpty(): ObjectModel {
        return new ObjectModel();
    }

    /**
     * Create an object model from JSON data
     */
    public static fromJson(json: any): ObjectModel {
        return new ObjectModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            codeDescription: this.codeDescription,
            isLookup: this.isLookup,
            parentObjectName: this.parentObjectName,
            modelPkg: this.modelPkg,
            lookupItem: this.lookupItem,
            childObject: this.childObject,
            prop: this.prop,
            propSubscription: this.propSubscription,
            calculatedProp: this.calculatedProp,
            report: this.report,
            objectWorkflow: this.objectWorkflow,
            fetch: this.fetch,
            query: this.query,
            intersectionObj: this.intersectionObj,
            isFullResearchDatabaseViewAllowed: this.isFullResearchDatabaseViewAllowed,
            isNotImplemented: this.isNotImplemented,
            isSoftDeleteUsed: this.isSoftDeleteUsed,
            cacheAllRecs: this.cacheAllRecs,
            cacheIndividualRecs: this.cacheIndividualRecs
        };
    }
}