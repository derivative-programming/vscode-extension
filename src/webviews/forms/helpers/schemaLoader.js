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
 * Get form schema properties (object workflow properties)
 * @param {Object} schema The full schema
 * @returns {Object} Form properties schema
 */
function getFormSchemaProperties(schema) {
    try {
        // Navigate to objectWorkflow schema: root > namespace > object > objectWorkflow > items > properties
        const formSchema = schema?.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties?.objectWorkflow?.items?.properties;
        
        if (!formSchema) {
            console.error("Form schema not found in expected path: properties.root.properties.namespace.items.properties.object.items.properties.objectWorkflow.items.properties");
            return {};
        }
        
        console.log("Successfully loaded form schema properties, found", Object.keys(formSchema).length, "properties");
        return formSchema;
    } catch (error) {
        console.error("Error extracting form schema properties:", error);
        return {};
    }
}

/**
 * Get form parameters schema (objectWorkflowParam)
 * Based on the mapping: reportColumn = objectWorkflowParam
 * @param {Object} schema The full schema
 * @returns {Object} Form parameters schema
 */
function getFormParamsSchema(schema) {
    try {
        // Navigate to objectWorkflowParam schema
        const formParamsSchema = schema?.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties?.objectWorkflow?.items?.properties?.objectWorkflowParam?.items?.properties;
        
        if (!formParamsSchema) {
            console.error("Form parameters schema not found in expected path: properties.root.properties.namespace.items.properties.object.items.properties.objectWorkflow.items.properties.objectWorkflowParam.items.properties");
            return {};
        }
        
        console.log("Successfully loaded form parameters schema properties, found", Object.keys(formParamsSchema).length, "properties");
        return formParamsSchema;
    } catch (error) {
        console.error("Error extracting form parameters schema:", error);
        return {};
    }
}

/**
 * Get form buttons schema (objectWorkflowButton)
 * Based on the mapping: reportButton = objectWorkflowButton
 * @param {Object} schema The full schema
 * @returns {Object} Form buttons schema
 */
function getFormButtonsSchema(schema) {
    try {
        // Navigate to objectWorkflowButton schema
        const formButtonsSchema = schema?.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties?.objectWorkflow?.items?.properties?.objectWorkflowButton?.items?.properties;
        
        if (!formButtonsSchema) {
            console.error("Form buttons schema not found in expected path: properties.root.properties.namespace.items.properties.object.items.properties.objectWorkflow.items.properties.objectWorkflowButton.items.properties");
            return {};
        }
        
        console.log("Successfully loaded form buttons schema properties, found", Object.keys(formButtonsSchema).length, "properties");
        return formButtonsSchema;
    } catch (error) {
        console.error("Error extracting form buttons schema:", error);
        return {};
    }
}

/**
 * Get form output variables schema (objectWorkflowOutputVar)
 * Based on the mapping: reportParam = objectWorkflowOutputVar
 * @param {Object} schema The full schema
 * @returns {Object} Form output variables schema
 */
function getFormOutputVarsSchema(schema) {
    try {
        // Navigate to objectWorkflowOutputVar schema
        const formOutputVarsSchema = schema?.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties?.objectWorkflow?.items?.properties?.objectWorkflowOutputVar?.items?.properties;
        
        if (!formOutputVarsSchema) {
            console.error("Form output variables schema not found in expected path: properties.root.properties.namespace.items.properties.object.items.properties.objectWorkflow.items.properties.objectWorkflowOutputVar.items.properties");
            return {};
        }
        
        console.log("Successfully loaded form output variables schema properties, found", Object.keys(formOutputVarsSchema).length, "properties");
        return formOutputVarsSchema;
    } catch (error) {
        console.error("Error extracting form output variables schema:", error);
        return {};
    }
}

module.exports = {
    loadSchema,
    getFormSchemaProperties,
    getFormParamsSchema,
    getFormButtonsSchema,
    getFormOutputVarsSchema
};
