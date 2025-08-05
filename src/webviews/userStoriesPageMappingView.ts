// userStoriesPageMappingView.ts
// TypeScript wrapper for userStoriesPageMappingView.js
// Created: August 5, 2025
// This file provides a TypeScript export for the userStoriesPageMappingView module

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

/**
 * Shows a user stories page mapping view in a webview
 * @param context The extension context
 * @param modelService The model service instance
 */
export function showUserStoriesPageMappingView(context: vscode.ExtensionContext, modelService: ModelService): void {
    // Import the JavaScript implementation dynamically to avoid TypeScript errors
    // when mixing TypeScript and JavaScript modules
    const userStoriesPageMappingViewJS = require('./userStoriesPageMappingView.js');
    
    // Call the JavaScript implementation using the exported function name
    userStoriesPageMappingViewJS.showUserStoriesPageMappingView(context, modelService);
}

/**
 * Gets the reference to the user stories page mapping view panel if it's open
 * @returns The user stories page mapping view panel info or null if not open
 */
export function getUserStoriesPageMappingPanel(): { type: string; context: vscode.ExtensionContext; modelService: ModelService } | null {
    const userStoriesPageMappingViewJS = require('./userStoriesPageMappingView.js');
    return userStoriesPageMappingViewJS.getUserStoriesPageMappingPanel();
}

/**
 * Closes the user stories page mapping panel if it's open
 */
export function closeUserStoriesPageMappingPanel(): void {
    const userStoriesPageMappingViewJS = require('./userStoriesPageMappingView.js');
    userStoriesPageMappingViewJS.closeUserStoriesPageMappingPanel();
}
