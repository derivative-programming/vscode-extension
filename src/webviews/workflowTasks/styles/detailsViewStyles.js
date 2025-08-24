"use strict";

function getDetailViewStyles() {
    // Reuse styles from general flow/forms for consistency
    const { getDetailViewStyles: getGeneralStyles } = require("../../generalFlow/styles/detailsViewStyles");
    const baseStyles = typeof getGeneralStyles === 'function' ? getGeneralStyles() : "";
    const extra = `
        .copy-workflow-task-name-button {
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
        .copy-workflow-task-name-button:hover { background: var(--vscode-toolbar-hoverBackground) !important; }
        .copy-workflow-task-name-button:active { background: var(--vscode-toolbar-activeBackground); transform: scale(0.95); }
        .copy-workflow-task-name-button .codicon { font-size: 16px; }
    `;
    return baseStyles + extra;
}

module.exports = { getDetailViewStyles };
