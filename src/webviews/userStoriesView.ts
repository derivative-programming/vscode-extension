// userStoriesView.ts
// TypeScript wrapper for userStoriesView.js
// Created on: May 10, 2025
// This file provides a TypeScript export for the userStoriesView module

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

/**
 * Shows a user stories view in a webview
 * @param context The extension context
 * @param modelService The model service instance
 * @param initialTab Optional tab to open initially (e.g., 'analytics' for role distribution)
 */
export function showUserStoriesView(context: vscode.ExtensionContext, modelService: ModelService, initialTab?: string): void {
    // Import the JavaScript implementation dynamically to avoid TypeScript errors
    // when mixing TypeScript and JavaScript modules
    const userStoriesViewJS = require('./userStoriesView.js');
    
    // Call the JavaScript implementation using the exported function name
    userStoriesViewJS.showUserStoriesView(context, modelService, initialTab);
}

/**
 * Gets the reference to the user stories view panel if it's open
 * @returns The user stories view panel info or null if not open
 */
export function getUserStoriesPanel(): { type: string; context: vscode.ExtensionContext; modelService: ModelService } | null {
    const userStoriesViewJS = require('./userStoriesView.js');
    return userStoriesViewJS.getUserStoriesPanel();
}

/**
 * Closes the user stories panel if it's open
 */
export function closeUserStoriesPanel(): void {
    const userStoriesViewJS = require('./userStoriesView.js');
    userStoriesViewJS.closeUserStoriesPanel();
}
