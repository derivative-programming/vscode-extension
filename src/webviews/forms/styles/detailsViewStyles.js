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
            width: 30%;
            float: left;
            padding-right: 15px;
        }
        
        .list-container select {
            width: 100%;
            height: 200px;
            margin-bottom: 10px;
        }
        
        .list-buttons {
            margin-top: 10px;
            display: flex;
            gap: 8px;
        }
        
        .list-buttons button {
            padding: 6px 12px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
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
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            position: relative;
            background-color: var(--vscode-editor-background);
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            width: 400px;
            max-width: 90vw;
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
        
        /* We'll use the global input styling instead of details-container specific styling 
           to match the report view styling approach */
        
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

        .control-with-checkbox input[type="checkbox"] {
            margin-left: 5px;
            flex: 0 0 auto;
            transform: scale(0.8);
            cursor: pointer;
        }
        
        .action-button {
            padding: 4px 8px;
            font-size: 0.85em;
        }
        
        .copy-props-button,
        .move-button,
        .reverse-button {
            padding: 6px 12px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .copy-props-button:hover,
        .move-button:hover,
        .reverse-button:hover {
            background-color: var(--vscode-button-hoverBackground);
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
        
        /* Validation styles for forms */
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
        
        .modal .form-row label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        /* Modal form styling - override horizontal form-row for vertical layout */
        .modal .form-row {
            display: block;
            margin-bottom: 15px;
        }
        
        .modal .form-row input[type="text"],
        .modal .form-row textarea,
        .modal .form-row select {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            box-sizing: border-box;
            font-family: var(--vscode-font-family);
            font-size: 14px;
            line-height: 1.4;
        }
        
        .modal .form-row textarea {
            resize: vertical;
            min-height: 100px;
        }
        
        .modal .form-row input[type="text"]:focus,
        .modal .form-row textarea:focus,
        .modal .form-row select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .modal .field-note {
            display: block;
            margin-top: 5px;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            font-style: italic;
        }
        
        /* Error message styling */
        .error-message {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 6px 8px;
            border-radius: 3px;
            font-size: 12px;
            margin-top: 5px;
        }
        
        /* Help text styling */
        .help-text {
            display: block;
            margin-top: 4px;
            color: var(--vscode-descriptionForeground);
            font-size: 11px;
            line-height: 1.3;
        }
        
        /* Disabled save button styling */
        .modal button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        /* Subscription Controls Styling */
        .subscription-controls {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .subscription-controls label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: var(--vscode-foreground);
            cursor: pointer;
        }
        
        .subscription-checkbox {
            cursor: pointer;
        }
    `;
}

module.exports = {
    getDetailViewStyles
};
