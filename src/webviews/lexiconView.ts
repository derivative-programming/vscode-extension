// lexiconView.ts
// TypeScript wrapper for lexiconView.js
// Created on: May 10, 2025
// This file provides TypeScript-compatible exports for the lexiconView.js file

import * as vscode from 'vscode';
import { ModelService } from '../services/modelService';

/**
 * Shows the lexicon view in a webview
 * @param context Extension context
 * @param modelService Model service instance
 */
export function showLexiconView(context: vscode.ExtensionContext, modelService: ModelService): void {
    // Import the JavaScript implementation dynamically to avoid TypeScript errors
    // when mixing TypeScript and JavaScript modules
    const lexiconViewJS = require('./lexiconView.js');
    
    // Call the JavaScript implementation
    lexiconViewJS.showLexiconView(context, modelService);
}
