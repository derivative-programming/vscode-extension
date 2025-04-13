/**
 * Query model that represents a query in the App DNA schema
 */

import { QueryParamModel } from "./queryParamModel";
import { QuerySchema } from "../interfaces";

export class QueryModel implements QuerySchema {
    name: string;
    storedProcName: string;
    isCustomSqlUsed: string;
    queryParam: QueryParamModel[];

    constructor(data?: Partial<QuerySchema>) {
        this.name = data?.name || "";
        this.storedProcName = data?.storedProcName || "";
        this.isCustomSqlUsed = data?.isCustomSqlUsed || "false";
        
        // Convert JSON array to typed model array
        this.queryParam = (data?.queryParam || []).map(param => 
            param instanceof QueryParamModel ? param : new QueryParamModel(param));
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
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            storedProcName: this.storedProcName,
            isCustomSqlUsed: this.isCustomSqlUsed,
            queryParam: this.queryParam.map(param => param.toJson())
        };
    }

    /**
     * Add a new parameter to the query
     */
    public addParam(param: QueryParamModel): void {
        this.queryParam.push(param);
    }
}