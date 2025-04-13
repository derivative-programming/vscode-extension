/**
 * Interface for the Root schema structure
 */

import { NamespaceSchema } from './namespace.interface';
import { NavButtonSchema } from './navButton.interface';
import { TemplateSetSchema } from './templateSet.interface';

export interface RootSchema {
    name: string; // Changed: Removed '?' as 'name' is required
    appName?: string;
    companyLegalName?: string;
    companyDomain?: string;
    projectName?: string;
    projectCode?: string;
    projectVersionNumber?: string;
    databaseName: string; // Changed: Removed '?' as 'databaseName' is required
    isDatabaseAuditColumnsCreated?: string;
    isInternalObjectApiCreated?: string;
    isBasicAuthenticationIncluded?: string;
    databaseTableNamePrefix?: string;
    suppressUsingDatabaseDeclarationInScripts?: string;
    suppressFillObjLookupTableScripts?: string;
    isValidationMissesLogged?: string;
    namespace?: NamespaceSchema[]; // Note: 'namespace' array itself is required, but the interface handles the array type.
    navButton?: NavButtonSchema[];
    templateSet?: TemplateSetSchema[];
}