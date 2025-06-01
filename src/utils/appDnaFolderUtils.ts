// src/utils/appDnaFolderUtils.ts
// Utilities for managing the .app_dna folder structure
// Created: 2025-01-27

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Ensures the .app_dna folder exists in the workspace
 * @param workspaceRoot The root path of the workspace
 * @returns The path to the .app_dna folder
 */
export function ensureAppDnaFolder(workspaceRoot: string): string {
    const appDnaFolderPath = path.join(workspaceRoot, '.app_dna');
    
    if (!fs.existsSync(appDnaFolderPath)) {
        fs.mkdirSync(appDnaFolderPath, { recursive: true });
    }
    
    return appDnaFolderPath;
}

/**
 * Gets the path to the validation reports directory, creating it if necessary
 * @param workspaceRoot The root path of the workspace
 * @returns The path to the validation reports directory
 */
export function getValidationReportsPath(workspaceRoot: string): string {
    const appDnaFolderPath = ensureAppDnaFolder(workspaceRoot);
    const validationReportsPath = path.join(appDnaFolderPath, 'validation_reports');
    
    if (!fs.existsSync(validationReportsPath)) {
        fs.mkdirSync(validationReportsPath, { recursive: true });
    }
    
    return validationReportsPath;
}

/**
 * Gets the path to the validation change requests directory, creating it if necessary
 * @param workspaceRoot The root path of the workspace
 * @returns The path to the validation change requests directory
 */
export function getValidationChangeRequestsPath(workspaceRoot: string): string {
    const appDnaFolderPath = ensureAppDnaFolder(workspaceRoot);
    const validationChangeRequestsPath = path.join(appDnaFolderPath, 'validation_change_requests');
    
    if (!fs.existsSync(validationChangeRequestsPath)) {
        fs.mkdirSync(validationChangeRequestsPath, { recursive: true });
    }
    
    return validationChangeRequestsPath;
}

/**
 * Gets the path to the AI processing reports directory, creating it if necessary
 * @param workspaceRoot The root path of the workspace
 * @returns The path to the AI processing reports directory
 */
export function getAIProcessingReportsPath(workspaceRoot: string): string {
    const appDnaFolderPath = ensureAppDnaFolder(workspaceRoot);
    const aiProcessingReportsPath = path.join(appDnaFolderPath, 'ai_processing_reports');
    
    if (!fs.existsSync(aiProcessingReportsPath)) {
        fs.mkdirSync(aiProcessingReportsPath, { recursive: true });
    }
    
    return aiProcessingReportsPath;
}

/**
 * Checks if a file exists in the old location and returns its path, otherwise returns the new location path
 * This provides backwards compatibility for existing files
 * @param workspaceRoot The root path of the workspace
 * @param oldRelativePath The old relative path from workspace root
 * @param newPath The new absolute path
 * @param filename The filename to check
 * @returns The path where the file exists or should be created
 */
export function getCompatibleFilePath(workspaceRoot: string, oldRelativePath: string, newPath: string, filename: string): string {
    const oldFilePath = path.join(workspaceRoot, oldRelativePath, filename);
    const newFilePath = path.join(newPath, filename);
    
    // If file exists in old location, return old path for backwards compatibility
    if (fs.existsSync(oldFilePath)) {
        return oldFilePath;
    }
    
    // Otherwise return new path
    return newFilePath;
}

/**
 * Gets the workspace root path from the first workspace folder
 * @returns The workspace root path or throws an error if no workspace is open
 */
export function getWorkspaceRoot(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder is open');
    }
    return workspaceFolders[0].uri.fsPath;
}