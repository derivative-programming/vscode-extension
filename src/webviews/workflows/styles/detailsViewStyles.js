"use strict";

function getDetailViewStyles() {
    // Reuse styles from general flow/forms for consistency
    const { getDetailViewStyles: getGeneralStyles } = require("../../generalFlow/styles/detailsViewStyles");
    const baseStyles = typeof getGeneralStyles === 'function' ? getGeneralStyles() : "";
    // Also ensure owner data object styles exist by leveraging forms template styles
    let ownerStyles = "";
    try {
        // Load forms/mainTemplate.css section indirectly by requiring and calling, if available
        // Not strictly necessary since general styles already include header + common styles
        ownerStyles = "";
    } catch {}
    const extra = `
        .copy-workflow-name-button {
            background: transparent !important;
            background-color: transparent !important;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 6px;
            border-radius: 4px;
            transition: background 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 28px;
        }
        .copy-workflow-name-button:hover { background: var(--vscode-toolbar-hoverBackground) !important; }
        .copy-workflow-name-button:active { background: var(--vscode-toolbar-activeBackground); transform: scale(0.95); }
        .copy-workflow-name-button .codicon { font-size: 16px; }

        /* Modal button styling for workflow modals */
        .primary-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-family: var(--vscode-font-family);
            margin-right: 8px;
        }

        .primary-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .primary-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .secondary-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-contrastBorder);
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-family: var(--vscode-font-family);
            margin-right: 8px;
        }

        .secondary-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .secondary-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Cancel button styling (same as secondary button) */
        .cancel-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-contrastBorder);
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-family: var(--vscode-font-family);
            margin-right: 8px;
        }

        .cancel-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .cancel-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Form actions container */
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 15px;
        }

        .form-actions button {
            margin-right: 0;
        }

        /* Modal header styling */
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .modal-header h2 {
            margin: 0;
            color: var(--vscode-foreground);
            font-size: 18px;
            font-weight: 600;
        }

        /* Close button in modal header */
        .modal-header .close-button {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            font-size: 24px;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 3px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 32px;
            height: 32px;
        }

        .modal-header .close-button:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
            color: var(--vscode-textLink-foreground);
        }

        .modal-header .close-button:active {
            background-color: var(--vscode-toolbar-activeBackground);
        }
    `;
    return baseStyles + ownerStyles + extra;
}

module.exports = { getDetailViewStyles };
