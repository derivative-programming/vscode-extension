// SEARCH_TAG: file utilities for VS Code extension
// Utility functions for file operations.

import * as vscode from 'vscode';
import * as fs from 'fs';

/**
 * Updates the file existence context to reflect whether the app-dna.json file exists
 * @param appDNAFilePath Path to the app-dna.json file
 * @returns Boolean indicating if the file exists
 */
export function updateFileExistsContext(appDNAFilePath: string | null): boolean {
    const fileExists = appDNAFilePath && fs.existsSync(appDNAFilePath);
    vscode.commands.executeCommand('setContext', 'appDnaFileExists', fileExists);
    return fileExists;
}

/**
 * Reads the model file name from the config file (app-dna.config.json) in the workspace root.
 * If the config file does not exist, it creates one with a default value.
 * @param workspaceFolder The workspace root folder path
 * @returns The model file name (e.g., 'app-dna.json')
 */
export function getModelFileNameFromConfig(workspaceFolder: string): string {
    const configPath = workspaceFolder ? `${workspaceFolder}/app-dna.config.json` : null;
    const defaultModelFile = "app-dna.json";
    if (!configPath) return defaultModelFile;
    try {
        if (fs.existsSync(configPath)) {
            const configRaw = fs.readFileSync(configPath, "utf8");
            const config = JSON.parse(configRaw);
            if (config && typeof config.modelFile === "string" && config.modelFile.trim() !== "") {
                return config.modelFile;
            }
        } else {
            // Create config file with default value
            fs.writeFileSync(configPath, JSON.stringify({ modelFile: defaultModelFile }, null, 2), "utf8");
        }
    } catch (err) {
        console.warn("Could not read or create config file:", err);
    }
    return defaultModelFile;
}