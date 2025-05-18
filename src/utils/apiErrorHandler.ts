// src/utils/apiErrorHandler.ts
// Utility to handle common API errors
// Created: May 16, 2025

import * as vscode from 'vscode';
import { AuthService } from '../services/authService';
import { showLoginView } from '../webviews/loginView';

/**
 * Handles API errors, specifically handling 401 unauthorized errors by logging out and showing the login view
 * @param context VS Code extension context
 * @param response Fetch API response object
 * @param customErrorMessage Optional custom error message to prepend to the status text
 * @returns True if the error was handled, false if the response was ok
 * @throws Error for all non-401 errors
 */
export async function handleApiError(
    context: vscode.ExtensionContext, 
    response: Response, 
    customErrorMessage: string = 'API Error'
): Promise<boolean> {
    if (response.ok) {
        return false; // No error to handle
    }

    // Handle specific 401 unauthorized errors
    if (response.status === 401) {
        console.error(`[ApiErrorHandler] Unauthorized error: ${response.status} ${response.statusText}`);
        
        // Log the user out
        const authService = AuthService.getInstance();
        await authService.logout();
        
        // Show a clear message to the user
        vscode.window.showErrorMessage('Your session has expired. Please log in again.');
        
        // Show the login view
        await showLoginView(context, () => {
            // vscode.window.showInformationMessage('Successfully logged in. You can retry your previous action now.');
        });
        
        return true; // Error was handled
    }
    
    // For all other errors, throw a specific error to be caught by the calling code
    throw new Error(`${customErrorMessage}: ${response.status} ${response.statusText}`);
}
