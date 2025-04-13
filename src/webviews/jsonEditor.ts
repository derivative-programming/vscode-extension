import * as vscode from 'vscode';
import { JsonTreeItem } from '../models/types';

/**
 * Opens a JSON editor webview panel
 * @param context Extension context
 * @param nodeLabel Label of the node to edit
 */
export function openJsonEditor(context: vscode.ExtensionContext, nodeLabel: string) {
    const panel = vscode.window.createWebviewPanel(
        'jsonEditor',
        `Edit JSON: ${nodeLabel}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    // Set the HTML content for the webview
    panel.webview.html = getWebviewContent(nodeLabel);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            if (message.command === 'save') {
                vscode.window.showInformationMessage(`Saved: ${JSON.stringify(message.data)}`);
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Gets HTML content for the JSON editor webview
 * @param nodeLabel Label of the node being edited
 * @returns HTML content as a string
 */
export function getWebviewContent(nodeLabel: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" width="device-width, initial-scale=1.0">
    <title>Edit JSON</title>
</head>
<body>
    <h1>Edit JSON: ${nodeLabel}</h1>
    <form id="jsonForm">
        <label for="key">Key:</label>
        <input type="text" id="key" name="key" value="${nodeLabel}"><br><br>
        <label for="value">Value:</label>
        <input type="text" id="value" name="value"><br><br>
        <button type="button" onclick="saveData()">Save</button>
    </form>
    <script>
        const vscode = acquireVsCodeApi();
        function saveData() {
            const form = document.getElementById('jsonForm');
            const data = {
                key: form.key.value,
                value: form.value.value
            };
            vscode.postMessage({ command: 'save', data });
        }
    </script>
</body>
</html>`;
}

/**
 * Shows object details in a webview
 * This is a fallback implementation that can be used if the objectDetailsView module fails to load
 * @param item The tree item representing the object
 * @param appDNAPath Path to the app-dna.json file
 */
export function showObjectDetails(item: JsonTreeItem, appDNAPath: string) {
    vscode.window.showInformationMessage(`Details for ${item.label} (fallback implementation)`);
}