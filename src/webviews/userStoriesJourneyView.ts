// userStoriesJourneyView.ts
// TypeScript wrapper for userStoriesJourneyView.js
// Created on: August 6, 2025
// This file provides a TypeScript export for the userStoriesJourneyView module

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

/**
 * Shows a user stories journey view in a webview
 * @param context The extension context
 * @param modelService The model service instance
 */
export function showUserStoriesJourneyView(context: vscode.ExtensionContext, modelService: ModelService): void {
    // Import the JavaScript implementation dynamically to avoid TypeScript errors
    // when mixing TypeScript and JavaScript modules
    const userStoriesJourneyViewJS = require('./userStoriesJourneyView.js');
    
    // Call the JavaScript implementation using the exported function name
    userStoriesJourneyViewJS.showUserStoriesJourneyView(context, modelService);
}

/**
 * Gets the reference to the user stories journey view panel if it's open
 * @returns The user stories journey view panel info or null if not open
 */
export function getUserStoriesJourneyPanel(): { type: string; context: vscode.ExtensionContext; modelService: ModelService } | null {
    const userStoriesJourneyViewJS = require('./userStoriesJourneyView.js');
    return userStoriesJourneyViewJS.getUserStoriesJourneyPanel();
}

/**
 * Closes the user stories journey panel if it's open
 */
export function closeUserStoriesJourneyPanel(): void {
    const userStoriesJourneyViewJS = require('./userStoriesJourneyView.js');
    userStoriesJourneyViewJS.closeUserStoriesJourneyPanel();
}
