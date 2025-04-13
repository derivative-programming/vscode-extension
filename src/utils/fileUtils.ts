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