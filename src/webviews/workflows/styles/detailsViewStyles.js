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

        /* Modal overlay and content styles for existing workflow task modal */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .modal-content {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 24px;
            min-width: 400px;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
        }

        .large-modal {
            min-width: 600px;
            width: 80vw;
        }

        .modal-body {
            margin: 20px 0;
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 20px;
        }

        .existing-tasks-select {
            width: 100%;
            min-height: 200px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            padding: 8px;
            font-family: var(--vscode-font-family);
            font-size: 13px;
        }

        .existing-tasks-select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }

        .existing-tasks-select option {
            padding: 4px 8px;
        }

        .existing-tasks-select option:hover,
        .existing-tasks-select option:focus {
            background-color: var(--vscode-list-hoverBackground);
        }

        .existing-tasks-select option:checked {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        .help-text {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 8px;
            font-style: italic;
        }

        .no-tasks-message {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            text-align: center;
            padding: 20px;
        }

        /* Button styles for modal */
        .btn {
            padding: 8px 16px;
            border-radius: 3px;
            border: none;
            cursor: pointer;
            font-size: 13px;
            font-family: var(--vscode-font-family);
            transition: background-color 0.15s;
        }

        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-contrastBorder);
        }

        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .modal-close-btn {
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

        .modal-close-btn:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
            color: var(--vscode-textLink-foreground);
        }

        /* Fix button positioning for workflow task buttons */
        .workflow-task-buttons {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }

        .view-icons[data-tab="workflowTasks"] {
            justify-content: flex-end !important;
        }

        .view-icons[data-tab="workflowTasks"] .add-prop-button {
            margin-right: 0;
        }

        /* Filter input styling for modal */
        .filter-input {
            width: 100%;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 13px;
            font-family: var(--vscode-font-family);
            margin-bottom: 8px;
        }

        .filter-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }

        .filter-input::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }
    `;
    return baseStyles + ownerStyles + extra;
}

module.exports = { getDetailViewStyles };
