/**
 * Query model that represents a query in the App DNA schema
 */

import { QueryParamModel } from "./queryParamModel";
import { QuerySchema } from "../interfaces";

export class QueryModel implements QuerySchema {
    name?: string;
    storedProcName?: string;
    isCustomSqlUsed?: string;
    queryParam?: QueryParamModel[];

    constructor(data?: Partial<QuerySchema>) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) { this.name = data.name; }
        if (data?.storedProcName !== undefined) { this.storedProcName = data.storedProcName; }
        if (data?.isCustomSqlUsed !== undefined) { this.isCustomSqlUsed = data.isCustomSqlUsed; }
        
        // Convert JSON array to typed model array if it exists
        if (data?.queryParam !== undefined) {
            this.queryParam = data.queryParam.map(param => 
                param instanceof QueryParamModel ? param : new QueryParamModel(param));
        }
    }

    /**
     * Create a new empty query model
     */
    public static createEmpty(): QueryModel {
        return new QueryModel();
    }

    /**
     * Create a query model from JSON data
     */
    public static fromJson(json: any): QueryModel {
        return new QueryModel(json);
    }

    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    public toJson(): any {
        const json: any = {};
        
        // Add optional properties only if they are defined
        if (this.name !== undefined) { json.name = this.name; }
        if (this.storedProcName !== undefined) { json.storedProcName = this.storedProcName; }
        if (this.isCustomSqlUsed !== undefined) { json.isCustomSqlUsed = this.isCustomSqlUsed; }
        
        // Add queryParam array if it exists and has elements
        if (this.queryParam !== undefined && this.queryParam.length > 0) {
            json.queryParam = this.queryParam.map(param => param.toJson());
        }
        
        return json;
    }

    /**
     * Add a new parameter to the query
     */
    public addParam(param: QueryParamModel): void {
        if (!this.queryParam) {
            this.queryParam = [];
        }
        this.queryParam.push(param);
    }
}