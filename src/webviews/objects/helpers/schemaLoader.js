"use strict";
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

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
 * Loads and parses the JSON schema
 * @returns {Object} The parsed schema object
 */
function loadSchema() {
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
                return JSON.parse(schemaContent) || {};
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
 * Gets object schema properties from the loaded schema
 * @param {Object} schema The complete schema object
 * @returns {Object} The object schema properties
 */
function getObjectSchemaProperties(schema) {
    // Try to get properties from the standard path first
    let objectSchemaProps = schema.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties || {};
    console.log("[getObjectSchemaProperties] Attempting standard path. Keys:", Object.keys(objectSchemaProps));

    // Fallback to alternative schema structure if needed
    if (!Object.keys(objectSchemaProps).length) {
        objectSchemaProps = schema.definitions?.Object?.properties || {};
        console.log("[getObjectSchemaProperties] Using fallback path: schema.definitions.Object.properties. Keys:", Object.keys(objectSchemaProps));
    }
    
    return objectSchemaProps;
}

/**
 * Gets property item schema properties from the loaded schema
 * @param {Object} schema The complete schema object
 * @returns {Object} The property item schema properties
 */
function getPropItemsSchema(schema) {
    // Extract property item schema from the schema document
    const propItemsSchema = schema.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties?.prop?.items?.properties || {};
    console.log("[getPropItemsSchema] Property schema keys:", Object.keys(propItemsSchema));
    return propItemsSchema;
}

/**
 * Gets lookupItem schema properties from the loaded schema
 * @param {Object} schema The complete schema object
 * @returns {Object} The lookupItem schema properties
 */
function getLookupItemsSchema(schema) {
    // Extract lookupItem schema from the schema document
    const lookupItemsSchema = schema.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties?.lookupItem?.items?.properties || {};
    console.log("[getLookupItemsSchema] LookupItem schema keys:", Object.keys(lookupItemsSchema));
    return lookupItemsSchema;
}

module.exports = {
    loadSchema,
    getObjectSchemaProperties,
    getPropItemsSchema,
    getLookupItemsSchema
};