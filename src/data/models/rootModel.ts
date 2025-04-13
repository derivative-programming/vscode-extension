/**
 * Root model object that represents the root of the App DNA schema
 */

import { RootSchema, NamespaceSchema, NavButtonSchema, TemplateSetSchema } from "../interfaces";

export class RootModel implements RootSchema {
    name: string;
    appName: string;
    companyLegalName: string;
    companyDomain: string;
    projectName: string;
    projectCode: string;
    projectVersionNumber: string;
    databaseName: string;
    isDatabaseAuditColumnsCreated: string;
    isInternalObjectApiCreated: string;
    isBasicAuthenticationIncluded: string;
    databaseTableNamePrefix: string;
    suppressUsingDatabaseDeclarationInScripts: string;
    suppressFillObjLookupTableScripts: string;
    isValidationMissesLogged: string;
    namespace: NamespaceSchema[];
    navButton: NavButtonSchema[];
    templateSet: TemplateSetSchema[];

    constructor(data?: Partial<RootSchema>) {
        this.name = data?.name || "";
        this.appName = data?.appName || "";
        this.companyLegalName = data?.companyLegalName || "";
        this.companyDomain = data?.companyDomain || "";
        this.projectName = data?.projectName || "";
        this.projectCode = data?.projectCode || "";
        this.projectVersionNumber = data?.projectVersionNumber || "";
        this.databaseName = data?.databaseName || "";
        this.isDatabaseAuditColumnsCreated = data?.isDatabaseAuditColumnsCreated || "false";
        this.isInternalObjectApiCreated = data?.isInternalObjectApiCreated || "false";
        this.isBasicAuthenticationIncluded = data?.isBasicAuthenticationIncluded || "false";
        this.databaseTableNamePrefix = data?.databaseTableNamePrefix || "";
        this.suppressUsingDatabaseDeclarationInScripts = data?.suppressUsingDatabaseDeclarationInScripts || "false";
        this.suppressFillObjLookupTableScripts = data?.suppressFillObjLookupTableScripts || "false";
        this.isValidationMissesLogged = data?.isValidationMissesLogged || "false";
        this.namespace = data?.namespace || [];
        this.navButton = data?.navButton || [];
        this.templateSet = data?.templateSet || [];
    }

    /**
     * Create a new empty root model
     */
    public static createEmpty(): RootModel {
        return new RootModel();
    }

    /**
     * Create a root model from JSON data
     */
    public static fromJson(json: any): RootModel {
        return new RootModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            appName: this.appName,
            companyLegalName: this.companyLegalName,
            companyDomain: this.companyDomain,
            projectName: this.projectName,
            projectCode: this.projectCode,
            projectVersionNumber: this.projectVersionNumber,
            databaseName: this.databaseName,
            isDatabaseAuditColumnsCreated: this.isDatabaseAuditColumnsCreated,
            isInternalObjectApiCreated: this.isInternalObjectApiCreated,
            isBasicAuthenticationIncluded: this.isBasicAuthenticationIncluded,
            databaseTableNamePrefix: this.databaseTableNamePrefix,
            suppressUsingDatabaseDeclarationInScripts: this.suppressUsingDatabaseDeclarationInScripts,
            suppressFillObjLookupTableScripts: this.suppressFillObjLookupTableScripts,
            isValidationMissesLogged: this.isValidationMissesLogged,
            namespace: this.namespace,
            navButton: this.navButton,
            templateSet: this.templateSet
        };
    }
}