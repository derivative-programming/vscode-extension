import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Global variable to store extension context for use across the extension
 */
let extensionContext: vscode.ExtensionContext;

/**
 * Sets the extension context for access throughout the extension
 * @param context VS Code extension context
 */
export function setExtensionContext(context: vscode.ExtensionContext): void {
    extensionContext = context;
}

/**
 * Gets the extension context
 * @returns The VS Code extension context
 */
export function getExtensionContext(): vscode.ExtensionContext {
    if (!extensionContext) {
        throw new Error("Extension context not initialized");
    }
    return extensionContext;
}

/**
 * Gets the absolute path to a resource in the extension
 * @param relativePath Relative path to the resource within the extension
 * @returns The absolute path to the resource
 */
export function getExtensionResourcePath(relativePath: string): string {
    if (!extensionContext) {
        throw new Error("Extension context not initialized");
    }
    return path.join(extensionContext.extensionPath, relativePath);
}