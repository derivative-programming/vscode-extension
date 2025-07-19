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
 * Updates the config file existence context to reflect whether the app-dna.config.json file exists
 * @param workspaceFolder Path to the workspace folder
 * @returns Boolean indicating if the config file exists
 */
export function updateConfigExistsContext(workspaceFolder: string | null): boolean {
    const configPath = workspaceFolder ? workspaceFolder + "/app-dna.config.json" : null;
    const configExists = configPath && fs.existsSync(configPath);
    vscode.commands.executeCommand('setContext', 'appDnaConfigExists', configExists);
    return configExists;
}

/**
 * Reads the model file name from the config file (app-dna.config.json) in the workspace root.
 * If the config file does not exist, it creates one with a default value.
 * @param workspaceFolder The workspace root folder path
 * @returns The model file name (e.g., 'app-dna.json')
 */
export function getModelFileNameFromConfig(workspaceFolder: string): string {
    const configPath = workspaceFolder ? workspaceFolder + "/app-dna.config.json" : null;
    const defaultModelFile = "app-dna.json";
    if (!configPath) {
        return defaultModelFile;
    }
    try {
        if (fs.existsSync(configPath)) {
            const configRaw = fs.readFileSync(configPath, "utf8");
            const config = JSON.parse(configRaw);
            if (config && typeof config.modelFile === "string" && config.modelFile.trim() !== "") {
                return config.modelFile;
            }
        } else {
            // Create config file with full default structure
            const defaultConfig = {
                version: "1.0.0",
                modelFile: defaultModelFile,
                settings: { 
                    codeGeneration: {
                        outputPath: "./fabrication_results"
                    },
                    editor: {
                        showAdvancedProperties: true,
                        expandNodesOnLoad: false
                    }
                }
            };
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf8");
        }
    } catch (err) {
        console.warn("Could not read or create config file:", err);
    }
    return defaultModelFile;
}

/**
 * Reads the output path from the config file (app-dna.config.json) in the workspace root.
 * If the config file does not exist or doesn't have outputPath, returns the default value.
 * @param workspaceFolder The workspace root folder path
 * @returns The output path for code generation (e.g., './fabrication_results')
 */
export function getOutputPathFromConfig(workspaceFolder: string): string {
    const configPath = workspaceFolder ? workspaceFolder + "/app-dna.config.json" : null;
    const defaultOutputPath = "./fabrication_results";
    if (!configPath) {
        return defaultOutputPath;
    }
    try {
        if (fs.existsSync(configPath)) {
            const configRaw = fs.readFileSync(configPath, "utf8");
            const config = JSON.parse(configRaw);
            if (config && 
                config.settings && 
                config.settings.codeGeneration && 
                typeof config.settings.codeGeneration.outputPath === "string" && 
                config.settings.codeGeneration.outputPath.trim() !== "") {
                return config.settings.codeGeneration.outputPath;
            }
        }
    } catch (err) {
        console.warn("Could not read config file for output path:", err);
    }
    return defaultOutputPath;
}

/**
 * Reads the expandNodesOnLoad setting from the config file (app-dna.config.json) in the workspace root.
 * If the config file does not exist or doesn't have the setting, returns the default value.
 * @param workspaceFolder The workspace root folder path
 * @returns True if nodes should be expanded on load, false otherwise
 */
export function getExpandNodesOnLoadFromConfig(workspaceFolder: string): boolean {
    const configPath = workspaceFolder ? workspaceFolder + "/app-dna.config.json" : null;
    const defaultExpandNodesOnLoad = false;
    if (!configPath) {
        return defaultExpandNodesOnLoad;
    }
    try {
        if (fs.existsSync(configPath)) {
            const configRaw = fs.readFileSync(configPath, "utf8");
            const config = JSON.parse(configRaw);
            if (config && 
                config.settings && 
                config.settings.editor && 
                typeof config.settings.editor.expandNodesOnLoad === "boolean") {
                return config.settings.editor.expandNodesOnLoad;
            }
        }
    } catch (err) {
        console.warn("Could not read config file for expandNodesOnLoad:", err);
    }
    return defaultExpandNodesOnLoad;
}

/**
 * Reads the showAdvancedProperties setting from the config file (app-dna.config.json) in the workspace root.
 * If the config file does not exist or doesn't have the setting, returns the default value.
 * @param workspaceFolder The workspace root folder path
 * @returns True if advanced properties should be shown, false otherwise
 */
export function getShowAdvancedPropertiesFromConfig(workspaceFolder: string): boolean {
    const configPath = workspaceFolder ? workspaceFolder + "/app-dna.config.json" : null;
    const defaultShowAdvancedProperties = true;
    if (!configPath) {
        return defaultShowAdvancedProperties;
    }
    try {
        if (fs.existsSync(configPath)) {
            const configRaw = fs.readFileSync(configPath, "utf8");
            const config = JSON.parse(configRaw);
            if (config && 
                config.settings && 
                config.settings.editor && 
                typeof config.settings.editor.showAdvancedProperties === "boolean") {
                return config.settings.editor.showAdvancedProperties;
            }
        }
    } catch (err) {
        console.warn("Could not read config file for showAdvancedProperties:", err);
    }
    return defaultShowAdvancedProperties;
}