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

/**
 * Gets the reference to the lexicon view panel if it's open
 * @returns The lexicon view panel info or null if not open
 */
export function getLexiconPanel(): { type: string; context: vscode.ExtensionContext; modelService: ModelService } | null {
    const lexiconViewJS = require('./lexiconView.js');
    return lexiconViewJS.getLexiconPanel();
}

/**
 * Closes the lexicon panel if it's open
 */
export function closeLexiconPanel(): void {
    const lexiconViewJS = require('./lexiconView.js');
    lexiconViewJS.closeLexiconPanel();
}
