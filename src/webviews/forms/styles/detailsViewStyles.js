"use strict";

/**
 * Returns CSS styles for the form details view
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
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-top: none;
            border-radius: 0 0 3px 3px;
        }
        
        .tab-content.active {
            display: block;
        }
        
        input[type="text"], select, textarea {
            flex: 1;
            padding: 5px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            box-sizing: border-box;
        }
        
        input[readonly], select[disabled], textarea[readonly] {
            background-color: var(--vscode-input-disabledBackground, #e9e9e9) !important;
            color: var(--vscode-input-disabledForeground, #999) !important;
            opacity: 0.8;
            cursor: not-allowed;
        }

        /* View switching styling */
        .view-icons {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        
        .view-icons-left {
            display: flex;
        }
        
        .icon {
            padding: 5px 10px;
            cursor: pointer;
            margin-right: 10px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border-radius: 3px;
            user-select: none;
        }
        
        .icon.active {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .view-content {
            display: none;
        }
        
        .view-content.active {
            display: block;
        }
        
        /* List view styling */
        .list-container {
            display: flex;
            width: 100%;
            margin-bottom: 15px;
        }
        
        .list-container select {
            flex: 1;
            min-height: 200px;
            margin-right: 10px;
        }
        
        .list-buttons {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }
        
        .list-buttons button {
            margin-bottom: 5px;
            white-space: nowrap;
        }
        
        .details-container {
            border: 1px solid var(--vscode-panel-border);
            padding: 15px;
            border-radius: 3px;
            margin-top: 10px;
        }
        
        /* Table view styling */
        .table-container {
            width: 100%;
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        thead {
            background-color: var(--vscode-panel-background);
            color: var(--vscode-panel-title-activeForeground);
        }
        
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        tbody tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        /* Modal styling */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
        }
        
        .modal-content {
            position: relative;
            background-color: var(--vscode-editor-background);
            margin: 5% auto;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            width: 80%;
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .close-button {
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            cursor: pointer;
        }
        
        .property-label {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .property-input {
            display: flex;
            align-items: center;
        }
        
        .property-input input[type="checkbox"] {
            margin-left: 8px;
            width: auto;
        }
        
        .tooltip {
            position: relative;
            display: inline-block;
            margin-left: 5px;
            cursor: help;
        }
        
        .tooltip-text {
            visibility: hidden;
            width: 200px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            text-align: center;
            border-radius: 6px;
            padding: 5px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -100px;
            opacity: 0;
            transition: opacity 0.3s;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .tooltip:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
        
        /* Form styling */
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-actions {
            margin-top: 20px;
            text-align: right;
        }
        
        .details-container input,
        .details-container select,
        .details-container textarea {
            width: 100%;
            padding: 5px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
        }
        
        .details-container input[readonly],
        .details-container select[disabled],
        .details-container textarea[readonly] {
            background-color: var(--vscode-input-disabledBackground, #e9e9e9);
            color: var(--vscode-input-disabledForeground, #999);
            opacity: 0.8;
            cursor: not-allowed;
        }
        
        /* Form row styling */
        .form-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }

        .form-row label {
            flex: 0 0 150px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        button {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            margin-right: 8px;
            margin-bottom: 5px;
            transition: background-color 0.2s;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        button:disabled {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            opacity: 0.6;
            cursor: not-allowed;
        }

        .setting-checkbox {
            margin-left: 5px;
            transform: scale(0.8);
            cursor: pointer;
        }
        
        /* Control with checkbox container for table cells */
        .control-with-checkbox {
            display: flex;
            align-items: center;
            width: 100%;
        }

        .control-with-checkbox input[type="text"],
        .control-with-checkbox select {
            flex: 1;
            min-width: 100px; /* Ensure minimum width for controls */
        }

        .control-with-checkbox .setting-checkbox {
            flex: 0 0 auto;
            margin-left: 5px;
        }
        
        .action-button {
            padding: 4px 8px;
            font-size: 0.85em;
        }
        
        .move-button, .copy-props-button, .reverse-button {
            width: 100%;
        }
        
        .add-prop-button {
            margin-left: auto;
        }
        
        .property-toggle {
            margin-left: 5px;
            transform: scale(0.8);
        }

        /* Modal form row styling */
        .modal .form-row {
            margin-bottom: 15px;
        }
        
        .modal .form-row label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .modal .form-row input[type="text"],
        .modal .form-row textarea,
        .modal .form-row select {
            width: 100%;
            padding: 5px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            box-sizing: border-box;
        }
    `;
}

module.exports = {
    getDetailViewStyles
};
