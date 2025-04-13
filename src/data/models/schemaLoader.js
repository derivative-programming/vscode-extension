"use strict";
/**
 * SchemaLoader - Responsible for loading and parsing the App DNA schema
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
class SchemaLoader {
    static instance;
    schemaCache = null;
    constructor() { }
    /**
     * Get the singleton instance of SchemaLoader
     */
    static getInstance() {
        if (!SchemaLoader.instance) {
            SchemaLoader.instance = new SchemaLoader();
        }
        return SchemaLoader.instance;
    }
    /**
     * Load the schema from the app-dna.schema.json file
     */
    async loadSchema() {
        if (this.schemaCache) {
            return this.schemaCache;
        }
        try {
            // Try multiple paths to find the schema file
            const possiblePaths = [];
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
            }
            catch (e) {
                console.log("Could not get extension context, will skip extension path", e);
            }
            // Try each path
            for (const schemaPath of possiblePaths) {
                console.log("Trying to load schema from:", schemaPath);
                if (fs.existsSync(schemaPath)) {
                    console.log("Loading schema from:", schemaPath);
                    const schemaContent = fs.readFileSync(schemaPath, "utf8");
                    this.schemaCache = JSON.parse(schemaContent);
                    return this.schemaCache;
                }
            }
            throw new Error("Could not find app-dna.schema.json in any of the expected locations: " + possiblePaths.join(", "));
        }
        catch (error) {
            console.error("Error loading schema:", error);
            throw error;
        }
    }
    /**
     * Get all non-array properties from the schema
     */
    async getNonArrayProperties() {
        const schema = await this.loadSchema();
        const properties = {};
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
    clearCache() {
        this.schemaCache = null;
    }
}
exports.SchemaLoader = SchemaLoader;
//# sourceMappingURL=schemaLoader.js.map