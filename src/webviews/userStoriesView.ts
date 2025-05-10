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
 */
export function showUserStoriesView(context: vscode.ExtensionContext, modelService: ModelService): void {
    // Import the JavaScript implementation dynamically to avoid TypeScript errors
    // when mixing TypeScript and JavaScript modules
    const userStoriesViewJS = require('./userStoriesView.js');
    
    // Call the JavaScript implementation using the exported function name
    userStoriesViewJS.showUserStoriesView(context, modelService);
}
