"use strict";
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

let schemaCache = null;

function getResourcePath(relativePath) {
    try {
        const { getExtensionResourcePath } = require("../../../utils/extensionContext");
        if (typeof getExtensionResourcePath === "function") {
            return getExtensionResourcePath(relativePath);
        }
    } catch (error) {
        console.warn("[getResourcePath] Could not load extensionContext utility:", error.message);
    }
    if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, relativePath);
    }
    return path.join(__dirname, "..", "..", "..", "..", relativePath);
}

function loadSchema() {
    if (schemaCache) {
        return schemaCache;
    }
    const possibleSchemaPaths = [
        getResourcePath("app-dna.schema.json"),
        path.join(__dirname, "..", "..", "..", "..", "app-dna.schema.json"),
        path.join(__dirname, "..", "..", "..", "..", "..", "app-dna.schema.json"),
        ...(vscode.workspace.workspaceFolders || []).map(folder => 
            path.join(folder.uri.fsPath, "app-dna.schema.json")
        )
    ].filter(Boolean);
    for (const schemaPath of possibleSchemaPaths) {
        try {
            if (fs.existsSync(schemaPath)) {
                const schemaContent = fs.readFileSync(schemaPath, "utf-8");
                schemaCache = JSON.parse(schemaContent);
                return schemaCache;
            }
        } catch (error) {
            console.error(`[loadSchema] Error checking path ${schemaPath}:`, error.message);
        }
    }
    console.warn("[loadSchema] Schema not found in any location. Returning empty schema.");
    return {};
}

// Page Init uses objectWorkflow schema and only output vars array
function getPageInitSchemaProperties(schema) {
    try {
        const props = schema?.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties?.objectWorkflow?.items?.properties;
        return props || {};
    } catch (e) {
        console.error("Error extracting page init schema properties:", e);
        return {};
    }
}

function getPageInitOutputVarsSchema(schema) {
    try {
        const props = schema?.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties?.objectWorkflow?.items?.properties?.objectWorkflowOutputVar?.items?.properties;
        return props || {};
    } catch (e) {
        console.error("Error extracting page init output vars schema:", e);
        return {};
    }
}

module.exports = {
    loadSchema,
    getPageInitSchemaProperties,
    getPageInitOutputVarsSchema
};
