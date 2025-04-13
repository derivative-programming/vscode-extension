"use strict";
/**
 * Root model object that represents the root of the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootModel = void 0;
class RootModel {
    name; // Required property
    appName;
    companyLegalName;
    companyDomain;
    projectName;
    projectCode;
    projectVersionNumber;
    databaseName; // Required property
    isDatabaseAuditColumnsCreated;
    isInternalObjectApiCreated;
    isBasicAuthenticationIncluded;
    databaseTableNamePrefix;
    suppressUsingDatabaseDeclarationInScripts;
    suppressFillObjLookupTableScripts;
    isValidationMissesLogged;
    namespace;
    navButton;
    templateSet;
    constructor(data) {
        // Required properties initialization
        this.name = data?.name || ""; // Set default empty string if not provided
        this.databaseName = data?.databaseName || ""; // Set default empty string if not provided
        // Optional properties are only assigned if they exist in data
        if (data?.appName !== undefined) {
            this.appName = data.appName;
        }
        if (data?.companyLegalName !== undefined) {
            this.companyLegalName = data.companyLegalName;
        }
        if (data?.companyDomain !== undefined) {
            this.companyDomain = data.companyDomain;
        }
        if (data?.projectName !== undefined) {
            this.projectName = data.projectName;
        }
        if (data?.projectCode !== undefined) {
            this.projectCode = data.projectCode;
        }
        if (data?.projectVersionNumber !== undefined) {
            this.projectVersionNumber = data.projectVersionNumber;
        }
        if (data?.isDatabaseAuditColumnsCreated !== undefined) {
            this.isDatabaseAuditColumnsCreated = data.isDatabaseAuditColumnsCreated;
        }
        if (data?.isInternalObjectApiCreated !== undefined) {
            this.isInternalObjectApiCreated = data.isInternalObjectApiCreated;
        }
        if (data?.isBasicAuthenticationIncluded !== undefined) {
            this.isBasicAuthenticationIncluded = data.isBasicAuthenticationIncluded;
        }
        if (data?.databaseTableNamePrefix !== undefined) {
            this.databaseTableNamePrefix = data.databaseTableNamePrefix;
        }
        if (data?.suppressUsingDatabaseDeclarationInScripts !== undefined) {
            this.suppressUsingDatabaseDeclarationInScripts = data.suppressUsingDatabaseDeclarationInScripts;
        }
        if (data?.suppressFillObjLookupTableScripts !== undefined) {
            this.suppressFillObjLookupTableScripts = data.suppressFillObjLookupTableScripts;
        }
        if (data?.isValidationMissesLogged !== undefined) {
            this.isValidationMissesLogged = data.isValidationMissesLogged;
        }
        if (data?.namespace !== undefined) {
            this.namespace = data.namespace;
        }
        if (data?.navButton !== undefined) {
            this.navButton = data.navButton;
        }
        if (data?.templateSet !== undefined) {
            this.templateSet = data.templateSet;
        }
    }
    /**
     * Create a new empty root model
     */
    static createEmpty() {
        return new RootModel({
            name: "",
            databaseName: ""
        }); // Initialize with required properties
    }
    /**
     * Create a root model from JSON data
     */
    static fromJson(json) {
        return new RootModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {
            name: this.name, // Always include required properties
            databaseName: this.databaseName
        };
        // Add optional properties only if they are defined
        if (this.appName !== undefined) {
            json.appName = this.appName;
        }
        if (this.companyLegalName !== undefined) {
            json.companyLegalName = this.companyLegalName;
        }
        if (this.companyDomain !== undefined) {
            json.companyDomain = this.companyDomain;
        }
        if (this.projectName !== undefined) {
            json.projectName = this.projectName;
        }
        if (this.projectCode !== undefined) {
            json.projectCode = this.projectCode;
        }
        if (this.projectVersionNumber !== undefined) {
            json.projectVersionNumber = this.projectVersionNumber;
        }
        if (this.isDatabaseAuditColumnsCreated !== undefined) {
            json.isDatabaseAuditColumnsCreated = this.isDatabaseAuditColumnsCreated;
        }
        if (this.isInternalObjectApiCreated !== undefined) {
            json.isInternalObjectApiCreated = this.isInternalObjectApiCreated;
        }
        if (this.isBasicAuthenticationIncluded !== undefined) {
            json.isBasicAuthenticationIncluded = this.isBasicAuthenticationIncluded;
        }
        if (this.databaseTableNamePrefix !== undefined) {
            json.databaseTableNamePrefix = this.databaseTableNamePrefix;
        }
        if (this.suppressUsingDatabaseDeclarationInScripts !== undefined) {
            json.suppressUsingDatabaseDeclarationInScripts = this.suppressUsingDatabaseDeclarationInScripts;
        }
        if (this.suppressFillObjLookupTableScripts !== undefined) {
            json.suppressFillObjLookupTableScripts = this.suppressFillObjLookupTableScripts;
        }
        if (this.isValidationMissesLogged !== undefined) {
            json.isValidationMissesLogged = this.isValidationMissesLogged;
        }
        // Add array properties only if they are defined
        if (this.namespace !== undefined && this.namespace.length > 0) {
            json.namespace = this.namespace;
        }
        if (this.navButton !== undefined && this.navButton.length > 0) {
            json.navButton = this.navButton;
        }
        if (this.templateSet !== undefined && this.templateSet.length > 0) {
            json.templateSet = this.templateSet;
        }
        return json;
    }
}
exports.RootModel = RootModel;
//# sourceMappingURL=rootModel.js.map