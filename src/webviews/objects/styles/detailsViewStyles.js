"use strict";

/**
 * Returns CSS styles for the details view as a string
 * @returns {string} CSS styles
 */
function getDetailViewStyles() {
    return `
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            padding: 15px;
            margin: 0;
        }

        /* Tabs styling */
        .tabs {
            display: flex;
            justify-content: flex-start; /* Left-justified tabs */
            border-bottom: 1px solid var(--vscode-editorGroup-border);
            margin-bottom: 10px;
        }

        .tab {
            padding: 10px 15px;
            cursor: pointer;
            border: 1px solid transparent;
            border-bottom: none;
            background-color: var(--vscode-tab-inactiveBackground);
            color: var(--vscode-tab-inactiveForeground);
        }

        .tab.active {
            background-color: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
            border-color: var(--vscode-editorGroup-border);
        }

        /* Tab content styling */
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

        /* View icons styling */
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

        .add-prop-button {
            margin-left: auto;
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

        .form-row input[type="text"],
        .form-row select {
            flex: 1;
            padding: 5px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }

        /* Consistent input and select styling */
        input[type="text"], select {
            padding: 5px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 2px;
            min-height: 24px;
        }

        /* Read-only controls styling */
        input[readonly], select[disabled] {
            background-color: var(--vscode-input-disabledBackground, #e9e9e9);
            color: var(--vscode-input-disabledForeground, #999);
            opacity: 0.8;
        }

        /* Checkbox styling */
        input[type="checkbox"] {
            margin-left: 5px;
            transform: scale(0.8);
        }

        /* Table styling */
        table {
            width: 100%;
            border-collapse: collapse;
        }

        .table-container {
            width: 100%;
            overflow-x: auto; /* Enable horizontal scrolling */
        }

        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-editorGroup-border);
            white-space: nowrap; /* Prevent text wrapping */
            min-width: 150px; /* Set minimum column width to 150px */
        }

        /* Name column should be wider to accommodate longer object names */
        th:first-child, td:first-child {
            min-width: 200px;
        }

        /* Improve table cell alignment and spacing */
        td input[type="text"], td select {
            width: calc(100% - 30px); /* Leave room for the checkbox */
            min-height: 24px;
            vertical-align: middle;
            display: inline-block;
        }

        /* Control with checkbox container */
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
        }

        th {
            background-color: var(--vscode-editor-lineHighlightBackground);
            position: sticky;
            top: 0; /* Make headers sticky when scrolling vertically */
            z-index: 1;
        }

        /* Button styling */
        button {
            padding: 6px 14px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        /* List and details container */
        .list-container {
            width: 30%;
            float: left;
            padding-right: 15px;
        }

        .details-container {
            width: 65%;
            float: left;
        }

        #propsList {
            width: 100%;
            height: 300px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }

        .actions {
            margin-top: 15px;
            text-align: right;
        }

        /* Clear fix */
        .view-content:after {
            content: "";
            display: table;
            clear: both;
        }

        /* Parent object field should be read-only */
        #parentObjectName {
            background-color: var(--vscode-input-disabledBackground, #e9e9e9);
            color: var(--vscode-input-disabledForeground, #999);
            opacity: 0.8;
        }
    `;
}

module.exports = {
    getDetailViewStyles
};