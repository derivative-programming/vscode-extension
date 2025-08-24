"use strict";
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

// Cache the schema to avoid multiple file reads
let schemaCache = null;

function getResourcePath(relativePath) {
    try {
        const { getExtensionResourcePath } = require("../../../utils/extensionContext");
        if (typeof getExtensionResourcePath === "function") {
            return getExtensionResourcePath(relativePath);
        }
    } catch (error) {
        console.warn("[workflowTasks.getResourcePath] Could not load extensionContext utility:", error.message);
    }

    if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, relativePath);
    }

    return path.join(__dirname, "..", "..", "..", "..", relativePath);
}

function loadSchema() {
    if (schemaCache) { return schemaCache; }
    const possibleSchemaPaths = [
        getResourcePath("app-dna.schema.json"),
        path.join(__dirname, "..", "..", "..", "..", "app-dna.schema.json"),
        path.join(__dirname, "..", "..", "..", "..", "..", "app-dna.schema.json"),
        ...(vscode.workspace.workspaceFolders || []).map(folder => path.join(folder.uri.fsPath, "app-dna.schema.json"))
    ].filter(Boolean);

    for (const schemaPath of possibleSchemaPaths) {
        try {
            if (fs.existsSync(schemaPath)) {
                const schemaContent = fs.readFileSync(schemaPath, "utf-8");
                schemaCache = JSON.parse(schemaContent);
                return schemaCache;
            }
        } catch (error) {
            console.error(`[workflowTasks.loadSchema] Error checking path ${schemaPath}:`, error.message);
        }
    }
    console.warn("[workflowTasks.loadSchema] Schema not found in any location. Returning empty schema.");
    return {};
}

function getWorkflowTaskSchemaProperties(schema) {
    try {
        // Reuse objectWorkflow items properties path
        const flowSchema = schema?.properties?.root?.properties?.namespace?.items?.properties?.object?.items?.properties?.objectWorkflow?.items?.properties;
        if (!flowSchema) {
            console.error("Workflow task schema not found in expected path: properties.root.properties.namespace.items.properties.object.items.properties.objectWorkflow.items.properties");
            return {};
        }
        return flowSchema;
    } catch (error) {
        console.error("Error extracting workflow task schema properties:", error);
        return {};
    }
}

module.exports = {
    loadSchema,
    getWorkflowTaskSchemaProperties
};
