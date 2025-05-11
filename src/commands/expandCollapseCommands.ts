// src/commands/expandCollapseCommands.ts
// Functions for expanding and collapsing tree items
// Last modified: May 11, 2025

import * as vscode from 'vscode';
import { JsonTreeDataProvider } from '../providers/jsonTreeDataProvider';
import { JsonTreeItem } from '../models/types';
import { addLogToCommandHistory } from '../utils/commandLog';

/**
 * Command handler for expanding all top level items in the tree view
 * @param jsonTreeDataProvider The tree data provider
 */
export async function expandAllTopLevelCommand(jsonTreeDataProvider: JsonTreeDataProvider): Promise<void> {
    try {
        console.log("Expanding all tree items");
        
        // Get the existing tree view, but don't recreate it (which could cause issues)
        // Instead, use the existing tree view if possible
        const treeView = vscode.window.createTreeView('appdna', { 
            treeDataProvider: jsonTreeDataProvider 
        });
        
        // Get the top level items
        const topLevelItems = await jsonTreeDataProvider.getChildren();
        
        if (topLevelItems && topLevelItems.length > 0) {
            console.log(`Found ${topLevelItems.length} top level items to expand`);
            
            // Expand each top level item separately with reveal
            for (const item of topLevelItems) {
                try {
                    console.log(`Revealing and expanding item: ${item.label}`);
                    // Use reveal with expand option set to expand multiple levels
                    await treeView.reveal(item, { 
                        select: false, 
                        focus: false, 
                        expand: 2  // Expand up to 2 levels deep
                    });
                    
                    // Give VS Code a moment to process each expand operation
                    await new Promise(resolve => setTimeout(resolve, 50));
                } catch (revealError) {
                    console.error(`Failed to reveal item ${item.label}:`, revealError);
                }
            }
            
            console.log("All top level items expanded successfully");
        } else {
            console.log("No top level items found to expand");
        }
        
        // Add entry to command log
        const commandLogEntry = `Expand all top level tree items in the AppDNA tree view`;
        console.log(commandLogEntry);
        addLogToCommandHistory(commandLogEntry);
    } catch (error) {
        console.error('Error expanding tree items:', error);
        vscode.window.showErrorMessage(`Failed to expand tree items: ${error.message}`);
    }
}

/**
 * Command handler for collapsing all items in the tree view
 */
export async function collapseAllTopLevelCommand(): Promise<void> {
    try {
        // Use the native VS Code treeView collapse API
        await vscode.commands.executeCommand('workbench.actions.treeView.appdna.collapseAll');
        
        // Add entry to command log
        const commandLogEntry = `Collapse all top level tree items in the AppDNA tree view`;
        console.log(commandLogEntry);
        addLogToCommandHistory(commandLogEntry);
    } catch (error) {
        console.error('Error collapsing tree items:', error);
        vscode.window.showErrorMessage(`Failed to collapse tree items: ${error.message}`);
    }
}
