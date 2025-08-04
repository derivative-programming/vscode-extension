// userStoriesQAView.ts
// TypeScript wrapper for userStoriesQAView.js
// Created on: August 4, 2025
// This file provides a TypeScript export for the userStoriesQAView module

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

/**
 * Shows a user stories QA view in a webview
 * @param context The extension context
 * @param modelService The model service instance
 */
export function showUserStoriesQAView(context: vscode.ExtensionContext, modelService: ModelService): void {
    // Import the JavaScript implementation dynamically to avoid TypeScript errors
    // when mixing TypeScript and JavaScript modules
    const userStoriesQAViewJS = require('./userStoriesQAView.js');
    
    // Call the JavaScript implementation using the exported function name
    userStoriesQAViewJS.showUserStoriesQAView(context, modelService);
}

/**
 * Gets the reference to the user stories QA view panel if it's open
 * @returns The user stories QA view panel info or null if not open
 */
export function getUserStoriesQAPanel(): { type: string; context: vscode.ExtensionContext; modelService: ModelService } | null {
    const userStoriesQAViewJS = require('./userStoriesQAView.js');
    return userStoriesQAViewJS.getUserStoriesQAPanel();
}

/**
 * Closes the user stories QA panel if it's open
 */
export function closeUserStoriesQAPanel(): void {
    const userStoriesQAViewJS = require('./userStoriesQAView.js');
    userStoriesQAViewJS.closeUserStoriesQAPanel();
}
