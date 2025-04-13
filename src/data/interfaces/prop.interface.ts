/**
 * Interface for the Property schema structure
 */

export interface PropSchema {
    name?: string;
    sqlServerDBDataType?: string;
    sqlServerDBDataTypeSize?: string;
    isFK?: string;
    isFKNonLookupIncludedInXMLFunction?: string;
    isFKConstraintSuppressed?: string;
    fKObjectName?: string;
    fKObjectPropertyName?: string;
    isFKLookup?: string;
    labelText?: string;
    codeDescription?: string;
    defaultValue?: string;
    isNotPublishedToSubscriptions?: string;
    isEncrypted?: string;
    isQueryByAvailable?: string;
    forceDBColumnIndex?: string;
}