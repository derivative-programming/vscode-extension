/**
 * Fetch model that represents a fetch in the App DNA schema
 */

import { FetchSchema } from "../interfaces";

export class FetchModel implements FetchSchema {
    name: string;
    byPropName: string;
    byObjectName: string;
    byObjectNamespaceName: string;
    includeInByObjectNameXMLFunction: string;

    constructor(data?: Partial<FetchSchema>) {
        this.name = data?.name || "";
        this.byPropName = data?.byPropName || "";
        this.byObjectName = data?.byObjectName || "";
        this.byObjectNamespaceName = data?.byObjectNamespaceName || "";
        this.includeInByObjectNameXMLFunction = data?.includeInByObjectNameXMLFunction || "false";
    }

    /**
     * Create a new empty fetch model
     */
    public static createEmpty(): FetchModel {
        return new FetchModel();
    }

    /**
     * Create a fetch model from JSON data
     */
    public static fromJson(json: any): FetchModel {
        return new FetchModel(json);
    }

    /**
     * Convert the model to a JSON object
     */
    public toJson(): any {
        return {
            name: this.name,
            byPropName: this.byPropName,
            byObjectName: this.byObjectName,
            byObjectNamespaceName: this.byObjectNamespaceName,
            includeInByObjectNameXMLFunction: this.includeInByObjectNameXMLFunction
        };
    }
}