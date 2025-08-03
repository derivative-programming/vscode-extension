// userStoryRoleRequirementsView.ts
// TypeScript wrapper for userStoryRoleRequirementsView.js
// Created on: August 3, 2025
// This file provides a TypeScript export for the userStoryRoleRequirementsView module

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

/**
 * Shows a user story role requirements view in a webview
 * @param context The extension context
 * @param modelService The model service instance
 */
export function showUserStoryRoleRequirementsView(context: vscode.ExtensionContext, modelService: ModelService): void {
    // Import the JavaScript implementation dynamically to avoid TypeScript errors
    // when mixing TypeScript and JavaScript modules
    const roleRequirementsViewJS = require('./userStoryRoleRequirementsView.js');
    
    // Call the JavaScript implementation using the exported function name
    roleRequirementsViewJS.showUserStoryRoleRequirementsView(context, modelService);
}

/**
 * Gets the reference to the user story role requirements view panel if it's open
 * @returns The user story role requirements view panel info or null if not open
 */
export function getUserStoryRoleRequirementsPanel(): any {
    const roleRequirementsViewJS = require('./userStoryRoleRequirementsView.js');
    return roleRequirementsViewJS.getUserStoryRoleRequirementsPanel();
}

/**
 * Closes the user story role requirements view panel if it's open
 */
export function closeUserStoryRoleRequirementsPanel(): void {
    const roleRequirementsViewJS = require('./userStoryRoleRequirementsView.js');
    roleRequirementsViewJS.closeUserStoryRoleRequirementsPanel();
}
