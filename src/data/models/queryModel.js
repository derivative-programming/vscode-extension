"use strict";
/**
 * Query model that represents a query in the App DNA schema
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryModel = void 0;
const queryParamModel_1 = require("./queryParamModel");
class QueryModel {
    name;
    storedProcName;
    isCustomSqlUsed;
    queryParam;
    constructor(data) {
        // Optional properties are only assigned if they exist in data
        if (data?.name !== undefined) {
            this.name = data.name;
        }
        if (data?.storedProcName !== undefined) {
            this.storedProcName = data.storedProcName;
        }
        if (data?.isCustomSqlUsed !== undefined) {
            this.isCustomSqlUsed = data.isCustomSqlUsed;
        }
        // Convert JSON array to typed model array if it exists
        if (data?.queryParam !== undefined) {
            this.queryParam = data.queryParam.map(param => param instanceof queryParamModel_1.QueryParamModel ? param : new queryParamModel_1.QueryParamModel(param));
        }
    }
    /**
     * Create a new empty query model
     */
    static createEmpty() {
        return new QueryModel();
    }
    /**
     * Create a query model from JSON data
     */
    static fromJson(json) {
        return new QueryModel(json);
    }
    /**
     * Convert the model to a JSON object, omitting undefined properties
     */
    toJson() {
        const json = {};
        // Add optional properties only if they are defined
        if (this.name !== undefined) {
            json.name = this.name;
        }
        if (this.storedProcName !== undefined) {
            json.storedProcName = this.storedProcName;
        }
        if (this.isCustomSqlUsed !== undefined) {
            json.isCustomSqlUsed = this.isCustomSqlUsed;
        }
        // Add queryParam array if it exists and has elements
        if (this.queryParam !== undefined && this.queryParam.length > 0) {
            json.queryParam = this.queryParam.map(param => param.toJson());
        }
        return json;
    }
    /**
     * Add a new parameter to the query
     */
    addParam(param) {
        if (!this.queryParam) {
            this.queryParam = [];
        }
        this.queryParam.push(param);
    }
}
exports.QueryModel = QueryModel;
//# sourceMappingURL=queryModel.js.map