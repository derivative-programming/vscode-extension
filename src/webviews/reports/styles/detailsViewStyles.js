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
            justify-content: flex-end;
            margin-bottom: 10px;
            width: 100%;
            gap: 8px;
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
        
        /* Form row flex layout for input controls */
        .form-row input[type="text"],
        .form-row select,
        .form-row textarea,
        .form-row .control-with-button {
            flex: 1;
            min-width: 0; /* Allow flex items to shrink below their content size */
        }
        
        /* Control with button container for input fields with browse buttons */
        .control-with-button {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .control-with-button input[type="text"] {
            flex: 1;
            min-width: 100px;
        }

        .control-with-button .lookup-button {
            flex: 0 0 auto;
            padding: 3px 6px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border, var(--vscode-button-secondaryBackground));
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            min-width: 24px;
            height: auto;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .control-with-button .lookup-button:hover:not(:disabled) {
            /* Remove dark blue background on hover - keep original background */
            border-color: var(--vscode-focusBorder);
        }

        .control-with-button .lookup-button:disabled {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-input-disabledForeground, #999);
            opacity: 0.6;
            cursor: not-allowed;
        }

        .control-with-button .lookup-button .codicon {
            font-size: 12px;
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
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            position: relative;
            background-color: var(--vscode-editor-background);
            margin: 10% auto;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            width: 50%;
            max-width: 600px;
            border-radius: 5px;
            max-height: 80vh;
            overflow-y: auto;
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
        
        .close-button {
            color: var(--vscode-descriptionForeground);
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        
        .close-button:hover {
            color: var(--vscode-foreground);
        }
        
        .modal-title {
            margin-top: 0;
        }
        
        /* Styles specific to report details */
        .action-buttons {
            margin-top: 20px;
        }
        
        /* List buttons container */
        .list-buttons {
            margin-top: 10px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
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
        
        .move-button:disabled {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: not-allowed;
            opacity: 0.6;
        }
        
        /* Subscription controls styling */
        .subscription-controls {
            margin: 15px 0;
            padding: 10px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        
        .subscription-controls label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: 13px;
            color: var(--vscode-foreground);
        }
        
        .subscription-checkbox {
            margin: 0;
            transform: scale(1.1);
        }

        /* Validation styles for forms */
        .validation-error {
            color: var(--vscode-errorForeground, #f44336);
            font-size: 12px;
            margin-top: 5px;
            margin-bottom: 10px;
            min-height: 16px;
        }        .field-note {
            color: var(--vscode-descriptionForeground, #999);
            font-size: 11px;
            margin-top: 3px;
            margin-bottom: 5px;
            font-style: italic;
        }

        /* Grid container for modal forms */
        .grid-container {
            display: grid;
            gap: 15px;
            margin-bottom: 15px;
        }

        /* Textarea styling */
        textarea {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            padding: 8px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            resize: vertical;
            min-height: 80px;
        }        textarea:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }

        /* Modal form styling - override horizontal form-row for vertical layout */
        .modal .form-row {
            display: block;
            margin-bottom: 15px;
        }

        .modal .form-row label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            flex: none;
        }

        .modal .form-row input[type="text"],
        .modal .form-row textarea {
            display: block;
            width: 100%;
            box-sizing: border-box;
        }

        .modal .field-note {
            display: block;
            margin-top: 5px;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            font-style: italic;
        }
    `;
}

module.exports = {
    getDetailViewStyles
};
