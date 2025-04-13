import * as vscode from 'vscode';
import * as path from 'path';
import { JsonTreeItem } from '../models/types';
import { JsonTreeDataProvider } from '../providers/jsonTreeDataProvider';
import { openJsonEditor } from '../webviews/jsonEditor';
import { addFileCommand, addObjectCommand, removeObjectCommand, generateCodeCommand } from './objectCommands';
import { newProjectCommand, openProjectCommand, saveProjectCommand } from './projectCommands';
import * as objectDetailsView from '../webviews/objectDetailsView';

/**
 * Registers all commands for the AppDNA extension
 * @param context Extension context
 * @param jsonTreeDataProvider The tree data provider
 * @param appDNAFilePath Path to the app-dna.json file
 */
export function registerCommands(
    context: vscode.ExtensionContext,
    jsonTreeDataProvider: JsonTreeDataProvider,
    appDNAFilePath: string | null
): void {
    // Register refresh command
    const refreshCommand = vscode.commands.registerCommand('appdna.refresh', () => {
        jsonTreeDataProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);

    // Register edit command
    const editCommand = vscode.commands.registerCommand('appdna.editObject', (node: JsonTreeItem) => {
        openJsonEditor(context, node.label);
    });
    context.subscriptions.push(editCommand);

    // Register add file command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.addFile', async () => {
            await addFileCommand(context, appDNAFilePath, jsonTreeDataProvider);
        })
    );

    // Register add object command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.addObject', async () => {
            await addObjectCommand(appDNAFilePath, jsonTreeDataProvider);
        })
    );

    // Register remove object command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.removeObject', async (node: JsonTreeItem) => {
            await removeObjectCommand(node, appDNAFilePath, jsonTreeDataProvider);
        })
    );

    // Register new project command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.newProject', async () => {
            await newProjectCommand(jsonTreeDataProvider);
        })
    );

    // Register open project command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.openProject', async () => {
            await openProjectCommand(jsonTreeDataProvider);
        })
    );

    // Register save project command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.saveProject', async () => {
            await saveProjectCommand(jsonTreeDataProvider);
        })
    );

    // Register generate code command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.generateCode', async () => {
            await generateCodeCommand(appDNAFilePath);
        })
    );

    // Register show details command
    context.subscriptions.push(
        vscode.commands.registerCommand('appdna.showDetails', (node: JsonTreeItem) => {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            const appDNAPath = workspaceFolder ? path.join(workspaceFolder, 'app-dna.json') : '';
            
            // Ensure the objectDetailsView module is loaded correctly
            if (!objectDetailsView || typeof objectDetailsView.showObjectDetails !== 'function') {
                vscode.window.showErrorMessage('Failed to load objectDetailsView module. Please check the extension setup.');
                return;
            }

            // Use the objectDetailsView implementation
            objectDetailsView.showObjectDetails(node, appDNAPath);
        })
    );
}