"use strict";

/**
 * This module provides access to the extension context throughout the extension
 */

// Global extension context object
let _extensionContext = null;

/**
 * Sets the extension context
 * @param {vscode.ExtensionContext} context The VS Code extension context
 */
function setExtensionContext(context) {
    _extensionContext = context;
    global.context = context; // Also set on global for legacy access
    console.log("Extension context set");
}

/**
 * Gets the extension context
 * @returns {vscode.ExtensionContext|null} The VS Code extension context or null if not set
 */
function getExtensionContext() {
    return _extensionContext;
}

/**
 * Gets the absolute path to a resource within the extension
 * @param {string} relativePath Path relative to the extension root
 * @returns {string|null} Absolute path to the resource or null if context not set
 */
function getExtensionResourcePath(relativePath) {
    if (!_extensionContext) {
        console.warn("Extension context not set, cannot resolve resource path:", relativePath);
        return null;
    }
    
    const path = require("path");
    return path.join(_extensionContext.extensionPath, relativePath);
}

module.exports = {
    setExtensionContext,
    getExtensionContext,
    getExtensionResourcePath
};