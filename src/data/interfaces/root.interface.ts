/**
 * Interface for the Root schema structure
 */

import { NamespaceSchema } from './namespace.interface';
import { NavButtonSchema } from './navButton.interface';
import { TemplateSetSchema } from './templateSet.interface';

export interface RootSchema {
    name?: string;
    appName?: string;
    companyLegalName?: string;
    companyDomain?: string;
    projectName?: string;
    projectCode?: string;
    projectVersionNumber?: string;
    databaseName?: string;
    isDatabaseAuditColumnsCreated?: string;
    isInternalObjectApiCreated?: string;
    isBasicAuthenticationIncluded?: string;
    databaseTableNamePrefix?: string;
    suppressUsingDatabaseDeclarationInScripts?: string;
    suppressFillObjLookupTableScripts?: string;
    isValidationMissesLogged?: string;
    namespace?: NamespaceSchema[];
    navButton?: NavButtonSchema[];
    templateSet?: TemplateSetSchema[];
}