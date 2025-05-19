"use strict";

/**
 * Returns CSS styles for the report details view
 * @returns {string} CSS styles as a string
 */
function getDetailViewStyles() {
    return `
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            padding: 10px;
            margin: 0;
        }
        
        h1 {
            font-size: 1.5em;
            margin-bottom: 16px;
        }
        
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 20px;
        }
        
        .tab {
            padding: 8px 16px;
            cursor: pointer;
            background-color: var(--vscode-tab-inactiveBackground);
            border: none;
            outline: none;
            color: var(--vscode-tab-inactiveForeground);
            margin-right: 4px;
            border-top-left-radius: 3px;
            border-top-right-radius: 3px;
            user-select: none;
        }
        
        .tab.active {
            background-color: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
            border-bottom: 2px solid var(--vscode-focusBorder);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        th, td {
            border: 1px solid var(--vscode-panel-border);
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
        }
        
        tr:nth-child(even) {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        input[type="text"], select, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            box-sizing: border-box;
        }
        
        input[readonly], select[readonly], textarea[readonly] {
            background-color: var(--vscode-input-placeholderForeground);
            opacity: 0.7;
            cursor: not-allowed;
        }
        
        input[type="checkbox"] {
            margin-right: 8px;
        }
        
        .checkbox-container {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        label {
            display: block;
            margin-bottom: 4px;
            font-weight: 600;
        }
        
        button {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            margin-right: 8px;
            transition: background-color 0.2s;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .enable-checkbox {
            display: inline-block;
            width: auto;
            margin-left: 10px;
            vertical-align: middle;
        }
        
        .property-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .tooltip {
            position: relative;
            display: inline-block;
            cursor: help;
            margin-left: 5px;
        }
        
        .tooltip .tooltip-text {
            visibility: hidden;
            width: 200px;
            background-color: var(--vscode-editorHoverWidget-background);
            color: var(--vscode-editorHoverWidget-foreground);
            text-align: left;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid var(--vscode-editorHoverWidget-border);
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .tooltip:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
        }
        
        .modal-content {
            position: relative;
            background-color: var(--vscode-editor-background);
            margin: 10% auto;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            width: 50%;
            border-radius: 5px;
        }
        
        .close {
            color: var(--vscode-descriptionForeground);
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .close:hover {
            color: var(--vscode-foreground);
        }
        
        .modal-title {
            margin-top: 0;
        }
        
        /* Styles specific to report details */
        .report-section {
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        
        .section-title {
            font-size: 1.2em;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .subsection {
            padding-left: 20px;
        }
        
        .action-buttons {
            margin-top: 20px;
        }
        
        .grid-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        @media (max-width: 768px) {
            .grid-container {
                grid-template-columns: 1fr;
            }
        }
    `;
}

module.exports = {
    getDetailViewStyles
};
