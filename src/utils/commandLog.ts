// commandLog.ts
// Utility functions for logging commands
// Created on: May 10, 2025
// This file provides functions for logging commands to a history file

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Adds a log entry to the command history file
 * @param commandText Text to log in the command history
 */
export function addLogToCommandHistory(commandText: string): void {
    try {
        // Get the extension's root path
        const extensionPath = vscode.extensions.getExtension('TestPublisher.appdna')?.extensionUri.fsPath;
        if (!extensionPath) {
            console.error('[CommandLog] Extension path not found');
            return;
        }

        const logFilePath = path.join(extensionPath, 'copilot-command-history.txt');
        const logEntry = `Command: ${commandText}\n`;
        
        // Append to file
        fs.appendFileSync(logFilePath, logEntry, 'utf8');
    } catch (error) {
        console.error('[CommandLog] Failed to log command:', error);
    }
}
