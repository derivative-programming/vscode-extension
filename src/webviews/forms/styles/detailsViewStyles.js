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
            border-radius: 3px;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .form-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        
        .form-table th, .form-table td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid var(--vscode-panel-border);
            vertical-align: middle;
        }
        
        .form-table th {
            background-color: var(--vscode-list-hoverBackground);
            font-weight: bold;
        }
        
        .form-table td {
            vertical-align: top;
        }
        
        .form-row {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }

        .form-row label {
            width: 150px;
            margin-right: 10px;
        }

        input[type="text"], select {
            flex-grow: 1;
            padding: 4px 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }

        input[readonly], select[disabled], textarea[readonly] {
            background-color: var(--vscode-input-disabledBackground, #e9e9e9);
            color: var(--vscode-input-disabledForeground, #999);
            opacity: 0.8;
            cursor: not-allowed;
        }
        
        .view-icons {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .view-icons-left {
            display: flex;
            align-items: center;
        }
        
        .icon {
            padding: 4px 8px;
            margin-right: 8px;
            cursor: pointer;
            border-radius: 3px;
            border: 1px solid transparent;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            font-size: 12px;
            user-select: none;
        }
        
        .icon.active {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border);
        }
        
        .icon:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .view-content {
            display: none;
        }
        
        .view-content.active {
            display: block;
        }
        
        .table-container {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
        }
        
        .list-container {
            display: flex;
            gap: 10px;
        }
        
        .list-container select {
            flex: 1;
            min-height: 200px;
            padding: 5px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
        }
        
        .list-container select option:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .list-buttons {
            display: flex;
            flex-direction: column;
            gap: 5px;
            width: 80px;
        }
        
        .details-container {
            flex: 2;
            padding: 10px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 3px;
        }
        
        .details-container form {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .details-container label {
            font-weight: bold;
            margin-bottom: 5px;
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
        .details-container select[readonly],
        .details-container textarea[readonly] {
            background-color: var(--vscode-input-background);
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
        
        .input-checkbox-container {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .input-checkbox-container input[type="text"],
        .input-checkbox-container select {
            flex: 1;
        }
        
        .input-checkbox-container input[type="checkbox"] {
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
            background-color: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
            background-color: var(--vscode-editor-background);
            margin: 5% auto;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            width: 80%;
            max-width: 600px;
            border-radius: 6px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .close-button {
            float: right;
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-foreground);
            cursor: pointer;
        }

        .close-button:hover {
            color: var(--vscode-errorForeground);
        }

        .modal-header h3 {
            margin: 0 0 15px 0;
            padding: 0;
        }

        .modal-body {
            margin: 15px 0;
        }

        .modal-footer {
            text-align: right;
            margin-top: 15px;
        }

        .modal-footer button {
            margin-left: 8px;
        }
        
        /* Add Property Button */
        .add-prop-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            margin-bottom: 10px;
        }
        
        .add-prop-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        /* Copy Props Button */
        .copy-props-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            white-space: nowrap;
        }
        
        .copy-props-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        /* Move Button styling */
        .move-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            white-space: nowrap;
        }
        
        .move-button:hover:not(:disabled) {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .move-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* Reverse Button styling */
        .reverse-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            white-space: nowrap;
            height: 34px; /* Explicit height to match other buttons */
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .reverse-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        /* Focus outline for accessibility */
        button:focus,
        input:focus,
        select:focus,
        textarea:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }
        
        /* Disabled state */
        button:disabled,
        input:disabled,
        select:disabled,
        textarea:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* Text area styling */
        textarea {
            min-height: 80px;
            resize: vertical;
        }
        
        /* Error message styling */
        .error-message {
            color: var(--vscode-errorForeground);
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid var(--vscode-errorForeground);
        }
        
        /* Modal styling */
        .modal {
            display: none;
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.4);
        }

        .modal-content {
            background-color: var(--vscode-editor-background);
            margin: 15% auto;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            width: 60%;
        }

        .close-button {
            color: var(--vscode-editor-foreground);
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .close-button:hover,
        .close-button:focus {
            color: var(--vscode-errorForeground);
        }

        .form-actions {
            margin-top: 20px;
            text-align: right;
        }

        .action-row {
            margin-top: 20px;
            text-align: right;
        }

        .table-actions {
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        /* Action button styling */
        .action-button {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 8px;
            border-radius: 3px;
            margin: 8px 0;
        }
        
        /* Success message styling */
        .success-message {
            color: var(--vscode-terminal-ansiGreen);
            background-color: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            padding: 8px;
            border-radius: 3px;
            margin: 8px 0;
        }
    `;
}

module.exports = {
    getDetailViewStyles
};
