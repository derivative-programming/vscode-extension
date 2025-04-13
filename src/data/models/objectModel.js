"use strict";
/**
 * Object model that represents an object in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectModel = void 0;
class ObjectModel {
    name; // Required property - removed optional ? modifier
    codeDescription;
    isLookup;
    parentObjectName;
    modelPkg;
    lookupItem;
    childObject;
    prop;
    propSubscription;
    calculatedProp;
    report;
    objectWorkflow;
    fetch;
    query;
    intersectionObj;
    isFullResearchDatabaseViewAllowed;
    isNotImplemented;
    isSoftDeleteUsed;
    cacheAllRecs;
    cacheIndividualRecs;
    constructor(data) {
        // Required property initialization
        this.name = data?.name || ""; // Set default empty string if not provided
        // Optional properties
        if (data?.codeDescription !== undefined) {
            this.codeDescription = data.codeDescription;
        }
        if (data?.isLookup !== undefined) {
            this.isLookup = data.isLookup;
        }
        if (data?.parentObjectName !== undefined) {
            this.parentObjectName = data.parentObjectName;
        }
        if (data?.modelPkg !== undefined) {
            this.modelPkg = data.modelPkg;
        }
        if (data?.lookupItem !== undefined) {
            this.lookupItem = data.lookupItem;
        }
        if (data?.childObject !== undefined) {
            this.childObject = data.childObject;
        }
        if (data?.prop !== undefined) {
            this.prop = data.prop;
        }
        if (data?.propSubscription !== undefined) {
            this.propSubscription = data.propSubscription;
        }
        if (data?.calculatedProp !== undefined) {
            this.calculatedProp = data.calculatedProp;
        }
        if (data?.report !== undefined) {
            this.report = data.report;
        }
        if (data?.objectWorkflow !== undefined) {
            this.objectWorkflow = data.objectWorkflow;
        }
        if (data?.fetch !== undefined) {
            this.fetch = data.fetch;
        }
        if (data?.query !== undefined) {
            this.query = data.query;
        }
        if (data?.intersectionObj !== undefined) {
            this.intersectionObj = data.intersectionObj;
        }
        if (data?.isFullResearchDatabaseViewAllowed !== undefined) {
            this.isFullResearchDatabaseViewAllowed = data.isFullResearchDatabaseViewAllowed;
        }
        if (data?.isNotImplemented !== undefined) {
            this.isNotImplemented = data.isNotImplemented;
        }
        if (data?.isSoftDeleteUsed !== undefined) {
            this.isSoftDeleteUsed = data.isSoftDeleteUsed;
        }
        if (data?.cacheAllRecs !== undefined) {
            this.cacheAllRecs = data.cacheAllRecs;
        }
        if (data?.cacheIndividualRecs !== undefined) {
            this.cacheIndividualRecs = data.cacheIndividualRecs;
        }
    }
    /**
     * Create a new empty object model
     */
    static createEmpty() {
        return new ObjectModel({ name: "" }); // Initialize with required property
    }
    /**
     * Create an object model from JSON data
     */
    static fromJson(json) {
        return new ObjectModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {
            name: this.name // Always include required property
        };
        if (this.codeDescription !== undefined) {
            json.codeDescription = this.codeDescription;
        }
        if (this.isLookup !== undefined) {
            json.isLookup = this.isLookup;
        }
        if (this.parentObjectName !== undefined) {
            json.parentObjectName = this.parentObjectName;
        }
        if (this.isFullResearchDatabaseViewAllowed !== undefined) {
            json.isFullResearchDatabaseViewAllowed = this.isFullResearchDatabaseViewAllowed;
        }
        if (this.isNotImplemented !== undefined) {
            json.isNotImplemented = this.isNotImplemented;
        }
        if (this.isSoftDeleteUsed !== undefined) {
            json.isSoftDeleteUsed = this.isSoftDeleteUsed;
        }
        if (this.cacheAllRecs !== undefined) {
            json.cacheAllRecs = this.cacheAllRecs;
        }
        if (this.cacheIndividualRecs !== undefined) {
            json.cacheIndividualRecs = this.cacheIndividualRecs;
        }
        if (this.modelPkg !== undefined && this.modelPkg.length > 0) {
            json.modelPkg = this.modelPkg;
        }
        if (this.lookupItem !== undefined && this.lookupItem.length > 0) {
            json.lookupItem = this.lookupItem;
        }
        if (this.childObject !== undefined && this.childObject.length > 0) {
            json.childObject = this.childObject;
        }
        if (this.prop !== undefined && this.prop.length > 0) {
            json.prop = this.prop;
        }
        if (this.propSubscription !== undefined && this.propSubscription.length > 0) {
            json.propSubscription = this.propSubscription;
        }
        if (this.calculatedProp !== undefined && this.calculatedProp.length > 0) {
            json.calculatedProp = this.calculatedProp;
        }
        if (this.report !== undefined && this.report.length > 0) {
            json.report = this.report;
        }
        if (this.objectWorkflow !== undefined && this.objectWorkflow.length > 0) {
            json.objectWorkflow = this.objectWorkflow;
        }
        if (this.fetch !== undefined && this.fetch.length > 0) {
            json.fetch = this.fetch;
        }
        if (this.query !== undefined && this.query.length > 0) {
            json.query = this.query;
        }
        if (this.intersectionObj !== undefined && this.intersectionObj.length > 0) {
            json.intersectionObj = this.intersectionObj;
        }
        return json;
    }
}
exports.ObjectModel = ObjectModel;
//# sourceMappingURL=objectModel.js.map