/**
 * Interface for the Query schema structure
 */

import { QueryParamSchema } from './queryParam.interface';

export interface QuerySchema {
    name?: string;
    storedProcName?: string;
    isCustomSqlUsed?: string;
    queryParam?: QueryParamSchema[];
}