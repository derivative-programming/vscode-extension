"use strict";
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

// Cache the schema to avoid multiple file reads
let schemaCache = null;

/**
 * Gets a resource path using either the extension context or the workspace folders
 * @param {string} relativePath The relative path to the resource
 * @returns {string|null} The absolute path to the resource or null if not found
 */
function getResourcePath(relativePath) {
    // Attempt to load from the extension context provider
    try {
        const { getExtensionResourcePath } = require("../../../utils/extensionContext");
        if (typeof getExtensionResourcePath === "function") {
            return getExtensionResourcePath(relativePath);
        }
    } catch (error) {
        console.warn("[getResourcePath] Could not load extensionContext utility:", error.message);
    }

    // Try to find from workspace folders
    if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, relativePath);
    }

    // Try relative paths from current file
    return path.join(__dirname, "..", "..", "..", "..", relativePath);
}

/**
 * Load the schema from file
 * @returns {Object} Schema JSON object
 */
function loadSchema() {
    if (schemaCache) {
        return schemaCache;
    }

    // Log the current directory for debugging
    console.log("[loadSchema] __dirname:", __dirname);
    
    // Try to find the schema in multiple locations to handle different environments
    const possibleSchemaPaths = [
        // Get path from resource path helper
        getResourcePath("app-dna.schema.json"),
        
        // Extension root - for development environment
        path.join(__dirname, "..", "..", "..", "..", "app-dna.schema.json"),
        
        // Extension dist folder - for production environment
        path.join(__dirname, "..", "..", "..", "..", "..", "app-dna.schema.json"),
        
        // Current workspace root folder - if schema is in workspace
        ...(vscode.workspace.workspaceFolders || []).map(folder => 
            path.join(folder.uri.fsPath, "app-dna.schema.json")
        )
    ].filter(Boolean); // Remove null entries
    
    console.log("[loadSchema] Searching for schema in these locations:", possibleSchemaPaths);
    
    // Try each possible location until we find the schema file
    for (const schemaPath of possibleSchemaPaths) {
        console.log("[loadSchema] Checking path:", schemaPath);
        try {
            if (fs.existsSync(schemaPath)) {
                console.log("[loadSchema] Found schema at:", schemaPath);
                const schemaContent = fs.readFileSync(schemaPath, "utf-8");
                schemaCache = JSON.parse(schemaContent);
                return schemaCache;
            }
        } catch (error) {
            console.error(`[loadSchema] Error checking path ${schemaPath}:`, error.message);
        }
    }
      // If we get here, we couldn't find the schema file
    console.warn("[loadSchema] Schema not found in any location. Returning empty schema.");
    return {};
}

/**
 * Get API site schema properties
 * @param {Object} schema The full schema
 * @returns {Object} API site properties schema
 */
function getApiSiteSchemaProperties(schema) {
    try {
        // Navigate to apiSite schema: root > namespace > apiSite > items > properties
        const apiSiteSchema = schema?.properties?.root?.properties?.namespace?.items?.properties?.apiSite?.items?.properties;
        
        if (!apiSiteSchema) {
            console.error("API site schema not found in expected path: properties.root.properties.namespace.items.properties.apiSite.items.properties");
            return {};
        }
        
        console.log("Successfully loaded API site schema properties, found", Object.keys(apiSiteSchema).length, "properties");
        return apiSiteSchema;
    } catch (error) {
        console.error("Error extracting API site schema properties:", error);
        return {};
    }
}

/**
 * Get API environment schema (apiEnvironment)
 * @param {Object} schema The full schema
 * @returns {Object} API environment schema
 */
function getApiEnvironmentSchema(schema) {
    try {
        // Navigate to apiEnvironment schema
        const apiEnvironmentSchema = schema?.properties?.root?.properties?.namespace?.items?.properties?.apiSite?.items?.properties?.apiEnvironment?.items?.properties;
        
        if (!apiEnvironmentSchema) {
            console.error("API environment schema not found in expected path: properties.root.properties.namespace.items.properties.apiSite.items.properties.apiEnvironment.items.properties");
            return {};
        }
        
        console.log("Successfully loaded API environment schema properties, found", Object.keys(apiEnvironmentSchema).length, "properties");
        return apiEnvironmentSchema;
    } catch (error) {
        console.error("Error extracting API environment schema:", error);
        return {};
    }
}

/**
 * Get API endpoint schema (apiEndPoint)
 * @param {Object} schema The full schema
 * @returns {Object} API endpoint schema
 */
function getApiEndPointSchema(schema) {
    try {
        // Navigate to apiEndPoint schema
        const apiEndPointSchema = schema?.properties?.root?.properties?.namespace?.items?.properties?.apiSite?.items?.properties?.apiEndPoint?.items?.properties;
        
        if (!apiEndPointSchema) {
            console.error("API endpoint schema not found in expected path: properties.root.properties.namespace.items.properties.apiSite.items.properties.apiEndPoint.items.properties");
            return {};
        }
        
        console.log("Successfully loaded API endpoint schema properties, found", Object.keys(apiEndPointSchema).length, "properties");
        return apiEndPointSchema;
    } catch (error) {
        console.error("Error extracting API endpoint schema:", error);
        return {};
    }
}

/**
 * Format a label by adding spaces between words
 * @param {string} label The label to format
 * @returns {string} Formatted label
 */
function formatLabel(label) {
    if (!label) {
        return "";
    }

    // Use regex for a more robust approach to handle various cases including acronyms
    let result = label
        // Insert space before a capital letter followed by a lowercase letter (e.g., AppDna -> App Dna)
        .replace(/([A-Z])([a-z])/g, " $1$2")
        // Insert space before a capital letter that is preceded by a lowercase letter or digit (e.g., appDNA -> app DNA, test1DNA -> test1 DNA)
        .replace(/([a-z\d])([A-Z])/g, "$1 $2")
        // Trim any leading or trailing whitespace
        .trim();

    // Capitalize the first letter
    if (result.length > 0) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    return result;
}

module.exports = {
    loadSchema,
    getApiSiteSchemaProperties,
    getApiEnvironmentSchema,
    getApiEndPointSchema,
    formatLabel
};