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
            padding: 15px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            border: 1px solid var(--vscode-editorGroup-border);
        }
        
        .tab-content.active {
            display: block;
        }
        
        .view-icons {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            width: 100%;
        }
        
        .view-icons-left {
            display: flex;
            justify-content: flex-start;
        }

        .icon {
            padding: 5px 10px;
            cursor: pointer;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            margin-right: 5px;
            border-radius: 3px;
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
          .list-container {
            width: 30%;
            float: left;
            padding-right: 15px;
        }
        
        .list-container select {
            width: 100%;
            height: 200px;
            margin-bottom: 10px;
        }
          .details-container {
            width: 65%;
            float: left;
        }
        
        /* Clear fix for floating elements */
        .view-content:after {
            content: "";
            display: table;
            clear: both;
        }
        
        .add-prop-button {
            margin-left: auto;
            padding: 6px 12px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .add-prop-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .form-row {
            margin-bottom: 15px;
        }
        
        .form-row label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
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
            flex: 1;
            padding: 5px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            box-sizing: border-box;
        }
        
        input[readonly], select[disabled], textarea[readonly] {
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

        .control-with-checkbox input[type="checkbox"] {
            margin-left: 5px;
            flex: 0 0 auto;
            transform: scale(0.8);
            cursor: pointer;
        }
        
        .button-checkbox {
            margin-left: 5px;
            transform: scale(0.8);
            cursor: pointer;
        }
        
        /* Modal Dialog Styling */
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
        .action-buttons {
            margin-top: 20px;
        }
    `;
}

module.exports = {
    getDetailViewStyles
};
