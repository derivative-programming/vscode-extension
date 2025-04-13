/**
 * SchemaLoader - Responsible for loading and parsing the App DNA schema
 */

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { AppDnaSchema } from "../interfaces";

export class SchemaLoader {
    private static instance: SchemaLoader;
    private schemaCache: AppDnaSchema | null = null;
    
    private constructor() {}
    
    /**
     * Get the singleton instance of SchemaLoader
     */
    public static getInstance(): SchemaLoader {
        if (!SchemaLoader.instance) {
            SchemaLoader.instance = new SchemaLoader();
        }
        return SchemaLoader.instance;
    }
    
    /**
     * Load the schema from the app-dna.schema.json file
     */
    public async loadSchema(): Promise<AppDnaSchema> {
        if (this.schemaCache) {
            return this.schemaCache;
        }
        
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error("No workspace folder found");
            }
            
            const schemaPath = path.join(workspaceFolders[0].uri.fsPath, "app-dna.schema.json");
            const schemaContent = fs.readFileSync(schemaPath, "utf8");
            this.schemaCache = JSON.parse(schemaContent) as AppDnaSchema;
            
            return this.schemaCache;
        } catch (error) {
            console.error("Error loading schema:", error);
            throw error;
        }
    }
    
    /**
     * Get all non-array properties from the schema
     */
    public async getNonArrayProperties(): Promise<Record<string, any>> {
        const schema = await this.loadSchema();
        const properties: Record<string, any> = {};
        
        // Extract root properties that are not arrays
        Object.entries(schema.root).forEach(([key, value]) => {
            if (!Array.isArray(value)) {
                properties[key] = value;
            }
        });
        
        return properties;
    }
    
    /**
     * Clear the schema cache
     */
    public clearCache(): void {
        this.schemaCache = null;
    }
}