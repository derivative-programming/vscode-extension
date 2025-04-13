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
            // Try multiple paths to find the schema file
            const possiblePaths: string[] = [];
            
            // First try workspace folders
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                possiblePaths.push(path.join(workspaceFolders[0].uri.fsPath, "app-dna.schema.json"));
            }
            
            // Then try extension paths if vscode extension context is available
            try {
                const extensionContextModule = require("../../utils/extensionContext");
                if (typeof extensionContextModule.getExtensionResourcePath === "function") {
                    possiblePaths.push(extensionContextModule.getExtensionResourcePath("app-dna.schema.json"));
                }
            } catch (e) {
                console.log("Could not get extension context, will skip extension path", e);
            }
            
            // Try each path
            for (const schemaPath of possiblePaths) {
                console.log("Trying to load schema from:", schemaPath);
                if (fs.existsSync(schemaPath)) {
                    console.log("Loading schema from:", schemaPath);
                    const schemaContent = fs.readFileSync(schemaPath, "utf8");
                    this.schemaCache = JSON.parse(schemaContent) as AppDnaSchema;
                    return this.schemaCache;
                }
            }
            
            throw new Error("Could not find app-dna.schema.json in any of the expected locations: " + possiblePaths.join(", "));
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