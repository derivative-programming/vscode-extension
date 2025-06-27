// src/utils/logoutConfirmationModal.ts
// Custom logout confirmation modal utility
// Created: June 27, 2025
// Purpose: Provides a custom logout confirmation modal that follows the same design patterns as other modals in the extension

import * as vscode from 'vscode';

/**
 * Shows a custom logout confirmation modal with VS Code-themed styling
 * @param onConfirm Callback function to execute when user confirms logout
 * @returns Promise that resolves when modal is closed
 */
export function showLogoutConfirmationModal(onConfirm: () => void): Promise<void> {
    return new Promise((resolve) => {
        // Create and show a webview panel for the logout confirmation
        const panel = vscode.window.createWebviewPanel(
            'logoutConfirmation',
            'Logout Confirmation',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: false
            }
        );

        // Set the HTML content for the modal
        panel.webview.html = getLogoutConfirmationHtml();

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'logout':
                    panel.dispose();
                    onConfirm();
                    resolve();
                    break;
                case 'cancel':
                    panel.dispose();
                    resolve();
                    break;
            }
        });

        // Resolve when panel is disposed (e.g., if user closes it directly)
        panel.onDidDispose(() => {
            resolve();
        });
    });
}

/**
 * Generates the HTML content for the logout confirmation modal
 * @returns HTML content as a string
 */
function getLogoutConfirmationHtml(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logout Confirmation</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            font-weight: var(--vscode-font-weight);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }

        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .modal-content {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
            width: 400px;
            max-width: 90vw;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            position: relative;
            z-index: 101;
        }

        .modal-content h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 1.2em;
            color: var(--vscode-foreground);
        }

        .modal-content p {
            margin-bottom: 20px;
            line-height: 1.5;
            color: var(--vscode-descriptionForeground);
        }

        .modal-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 15px;
        }

        .refresh-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 13px;
            font-family: var(--vscode-font-family);
            min-width: 80px;
        }

        .refresh-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .refresh-button:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }

        .modal-button-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .modal-button-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        /* Ensure focus is visible */
        .refresh-button:focus-visible {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }
    </style>
</head>
<body>
    <div class="modal">
        <div class="modal-content">
            <h3>Logout Confirmation</h3>
            <p>Are you sure you want to log out from Model Services?</p>
            <div class="modal-buttons">
                <button id="logoutBtn" class="refresh-button">Logout</button>
                <button id="cancelBtn" class="refresh-button modal-button-secondary">Cancel</button>
            </div>
        </div>
    </div>

    <script>
        // Acquire the VS Code API for communication
        const vscode = acquireVsCodeApi();
        
        // Get button references
        const logoutBtn = document.getElementById('logoutBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        
        // Add event listeners
        logoutBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'logout' });
        });
        
        cancelBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'cancel' });
        });
        
        // Focus on the cancel button by default (safer default)
        cancelBtn.focus();
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                vscode.postMessage({ command: 'cancel' });
            } else if (event.key === 'Enter') {
                // Enter key should trigger the focused button
                const focusedElement = document.activeElement;
                if (focusedElement === logoutBtn) {
                    vscode.postMessage({ command: 'logout' });
                } else {
                    vscode.postMessage({ command: 'cancel' });
                }
            }
        });
        
        // Close modal when clicking outside the modal content
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                vscode.postMessage({ command: 'cancel' });
            }
        });
    </script>
</body>
</html>`;
}
