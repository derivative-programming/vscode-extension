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
 * Get report schema properties
 * @param {Object} schema The full schema
 * @returns {Object} Report properties schema
 */
function getReportSchemaProperties(schema) {
    try {
        // Find report schema definition
        if (!schema.definitions || !schema.definitions.reportSchema) {
            console.error("Report schema not found in schema definitions");
            return {};
        }
        
        // Return properties object from report schema
        return schema.definitions.reportSchema.properties || {};
    } catch (error) {
        console.error("Error getting report schema properties:", error);
        return {};
    }
}

/**
 * Get reportColumn schema properties
 * @param {Object} schema The full schema
 * @returns {Object} ReportColumn schema
 */
function getReportColumnsSchema(schema) {
    try {
        // Find reportColumn schema definition
        if (!schema.definitions || !schema.definitions.reportColumnSchema) {
            console.error("ReportColumn schema not found in schema definitions");
            return {};
        }
        
        return schema.definitions.reportColumnSchema.properties || {};
    } catch (error) {
        console.error("Error getting reportColumn schema:", error);
        return {};
    }
}

/**
 * Get reportButton schema properties
 * @param {Object} schema The full schema
 * @returns {Object} ReportButton schema
 */
function getReportButtonsSchema(schema) {
    try {
        // Find reportButton schema definition
        if (!schema.definitions || !schema.definitions.reportButtonSchema) {
            console.error("ReportButton schema not found in schema definitions");
            return {};
        }
        
        return schema.definitions.reportButtonSchema.properties || {};
    } catch (error) {
        console.error("Error getting reportButton schema:", error);
        return {};
    }
}

/**
 * Get reportParam schema properties
 * @param {Object} schema The full schema
 * @returns {Object} ReportParam schema
 */
function getReportParamsSchema(schema) {
    try {
        // Find reportParam schema definition
        if (!schema.definitions || !schema.definitions.reportParamSchema) {
            console.error("ReportParam schema not found in schema definitions");
            return {};
        }
        
        return schema.definitions.reportParamSchema.properties || {};
    } catch (error) {
        console.error("Error getting reportParam schema:", error);
        return {};
    }
}

module.exports = {
    loadSchema,
    getReportSchemaProperties,
    getReportColumnsSchema,
    getReportButtonsSchema,
    getReportParamsSchema
};
