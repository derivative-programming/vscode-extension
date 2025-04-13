/**
 * Property model that represents a property in the App DNA schema
 */

import { PropSchema } from "../interfaces";

export class PropModel implements PropSchema {
    name: string;
    sqlServerDBDataType: string;
    sqlServerDBDataTypeSize: string;
    isFK: string;
    isFKNonLookupIncludedInXMLFunction: string;
    isFKConstraintSuppressed: string;
    fKObjectName: string;
    fKObjectPropertyName: string;
    isFKLookup: string;
    labelText: string;
    codeDescription: string;
    defaultValue: string;
    isNotPublishedToSubscriptions: string;
    isEncrypted: string;
    isQueryByAvailable: string;
    forceDBColumnIndex: string;

    constructor(data?: Partial<PropSchema>) {
        this.name = data?.name || "";
        this.sqlServerDBDataType = data?.sqlServerDBDataType || "nvarchar";
        this.sqlServerDBDataTypeSize = data?.sqlServerDBDataTypeSize || "100";
        this.isFK = data?.isFK || "false";
        this.isFKNonLookupIncludedInXMLFunction = data?.isFKNonLookupIncludedInXMLFunction || "false";
        this.isFKConstraintSuppressed = data?.isFKConstraintSuppressed || "false";
        this.fKObjectName = data?.fKObjectName || "";
        this.fKObjectPropertyName = data?.fKObjectPropertyName || "";
        this.isFKLookup = data?.isFKLookup || "false";
        this.labelText = data?.labelText || "";
        this.codeDescription = data?.codeDescription || "";
        this.defaultValue = data?.defaultValue || "";
        this.isNotPublishedToSubscriptions = data?.isNotPublishedToSubscriptions || "false";
        this.isEncrypted = data?.isEncrypted || "false";
        this.isQueryByAvailable = data?.isQueryByAvailable || "false";
        this.forceDBColumnIndex = data?.forceDBColumnIndex || "false";
    }

    /**
     * Create a new empty property model
     */
    public static createEmpty(): PropModel {
        return new PropModel();
    }

    /**
     * Create a property model from JSON data
     */
    public static fromJson(json: any): PropModel {
        return new PropModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            sqlServerDBDataType: this.sqlServerDBDataType,
            sqlServerDBDataTypeSize: this.sqlServerDBDataTypeSize,
            isFK: this.isFK,
            isFKNonLookupIncludedInXMLFunction: this.isFKNonLookupIncludedInXMLFunction,
            isFKConstraintSuppressed: this.isFKConstraintSuppressed,
            fKObjectName: this.fKObjectName,
            fKObjectPropertyName: this.fKObjectPropertyName,
            isFKLookup: this.isFKLookup,
            labelText: this.labelText,
            codeDescription: this.codeDescription,
            defaultValue: this.defaultValue,
            isNotPublishedToSubscriptions: this.isNotPublishedToSubscriptions,
            isEncrypted: this.isEncrypted,
            isQueryByAvailable: this.isQueryByAvailable,
            forceDBColumnIndex: this.forceDBColumnIndex
        };
    }
}