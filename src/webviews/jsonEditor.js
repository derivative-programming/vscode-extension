"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.openJsonEditor = openJsonEditor;
exports.getWebviewContent = getWebviewContent;
exports.showObjectDetails = showObjectDetails;
const vscode = __importStar(require("vscode"));
/**
 * Opens a JSON editor webview panel
 * @param context Extension context
 * @param nodeLabel Label of the node to edit
 */
function openJsonEditor(context, nodeLabel) {
    const panel = vscode.window.createWebviewPanel('jsonEditor', `Edit JSON: ${nodeLabel}`, vscode.ViewColumn.One, {
        enableScripts: true
    });
    // Set the HTML content for the webview
    panel.webview.html = getWebviewContent(nodeLabel);
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'save') {
            vscode.window.showInformationMessage(`Saved: ${JSON.stringify(message.data)}`);
        }
    }, undefined, context.subscriptions);
}
/**
 * Gets HTML content for the JSON editor webview
 * @param nodeLabel Label of the node being edited
 * @returns HTML content as a string
 */
function getWebviewContent(nodeLabel) {
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
function showObjectDetails(item, appDNAPath) {
    vscode.window.showInformationMessage(`Details for ${item.label} (fallback implementation)`);
}
//# sourceMappingURL=jsonEditor.js.map