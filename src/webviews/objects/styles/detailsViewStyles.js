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

        .add-lookup-item-button {
            margin-left: auto;
        }

        .copy-lookup-items-button {
            margin-top: 10px;
            padding: 5px 10px;
        }

        .delete-lookup-item {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            padding: 3px 8px;
            cursor: pointer;
            border-radius: 3px;
        }

        .delete-lookup-item:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
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
        .form-row select,
        .form-row textarea {
            flex: 1;
            padding: 5px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }

        /* Consistent input and select styling */
        input[type="text"], select, textarea {
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
        }        /* Control with checkbox container */
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

        /* Control with button container for list view */
        .control-with-button {
            display: flex;
            align-items: center;
            width: 100%;
        }

        .control-with-button input[type="text"],
        .control-with-button select {
            flex: 1;
            min-width: 100px; /* Ensure minimum width for controls */
        }

        /* Lookup button styling */
        .lookup-button {
            margin-left: 3px;
            margin-right: 2px;
            padding: 2px 6px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 2px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 20px;
            height: 22px;
        }

        .lookup-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .lookup-button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .lookup-button .codicon {
            font-size: 14px;
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

        .copy-props-button {
            margin-top: 10px;
            font-size: 12px;
            padding: 4px 8px;
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

        #lookupItemsList {
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

        /* View content styling */
        .view-content {
            display: none !important;
        }

        .view-content.active {
            display: block !important;
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

        /* Modal Dialog Styling */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
        }

        .modal-content {
            position: relative;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            border: 1px solid var(--vscode-editorGroup-border);
            border-radius: 4px;
            padding: 20px;
            width: 500px;
            max-width: 90%;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .close-button {
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
        }

        .validation-error {
            color: var(--vscode-errorForeground, #f44336);
            font-size: 12px;
            margin-top: 5px;
            margin-bottom: 10px;
            min-height: 16px;
        }

        .field-note {
            color: var(--vscode-descriptionForeground, #999);
            font-size: 11px;
            margin-top: 3px;
            margin-bottom: 5px;
            font-style: italic;
        }

        /* Tabs within modal */
        .modal .tabs {
            border-bottom: 1px solid var(--vscode-editorGroup-border);
            margin-bottom: 15px;
        }

        .modal .tab {
            padding: 8px 12px;
            font-size: 14px;
        }

        /* Form elements in modal */
        .modal .form-row {
            margin-bottom: 15px;
            display: block;
        }

        .modal .form-row label {
            display: block;
            margin-bottom: 5px;
        }

        .modal .form-row input[type="text"],
        .modal .form-row textarea {
            width: 100%;
            display: block;
        }

        .modal .form-row textarea {
            min-height: 100px;
            resize: vertical;
        }

        .modal button {
            margin-top: 10px;
        }

        /* Object Search modal specific styles */
        .modal-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            justify-content: flex-end;
        }

        .modal-buttons button {
            margin-top: 0;
        }

        #objectList {
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 2px;
        }

        #objectList option {
            padding: 4px 8px;
        }

        #objectList option:hover,
        #objectList option:focus {
            background-color: var(--vscode-list-hoverBackground);
        }

        #objectList option:checked {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        /* Disabled button styling for modal */
        .modal-buttons button:disabled {
            background-color: #464647 !important;
            color: #888888 !important;
            cursor: not-allowed !important;
            opacity: 0.5 !important;
            border: 1px solid #555555 !important;
            box-shadow: none !important;
        }

        .modal-buttons button:disabled:hover {
            background-color: #464647 !important;
            color: #888888 !important;
            cursor: not-allowed !important;
            box-shadow: none !important;
        }
    `;
}

module.exports = {
    getDetailViewStyles
};