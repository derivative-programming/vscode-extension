"use strict";

function getDetailViewStyles() {
    return `
    body { font-family: var(--vscode-font-family); margin: 0; padding: 12px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
    h1 { font-size: 18px; margin: 0 0 12px 0; }
    .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--vscode-panel-border); margin-bottom: 12px; }
    .tab { padding: 6px 10px; cursor: pointer; border: 1px solid var(--vscode-panel-border); border-bottom: none; border-radius: 4px 4px 0 0; background: var(--vscode-sideBar-background); }
    .tab.active { background: var(--vscode-editor-background); font-weight: 600; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    /* Match Forms details layout for control widths */
    .form-row { display: flex; align-items: center; margin-bottom: 10px; }
    .form-row label { flex: 0 0 150px; font-weight: bold; }
    .form-row input[type="text"],
    .form-row select,
    .form-row textarea,
    .form-row .control-with-button { flex: 1; min-width: 0; }
    label { font-weight: 500; }
    input[type="text"], select, textarea { padding: 4px 8px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 2px; }
    input[readonly], select[disabled], textarea[readonly] { background-color: var(--vscode-input-disabledBackground, #e9e9e9) !important; color: var(--vscode-input-disabledForeground, #999) !important; opacity: 0.8; cursor: not-allowed; }
    .control-with-checkbox { display: flex; align-items: center; gap: 8px; width: 100%; }
    .control-with-checkbox input[type="text"],
    .control-with-checkbox select { flex: 1; min-width: 100px; }
    .control-with-checkbox input[type="checkbox"] { margin-left: 5px; flex: 0 0 auto; transform: scale(0.8); cursor: pointer; }

    .control-with-button { display: flex; align-items: center; gap: 4px; }
    .control-with-button input[type="text"] { flex: 1; min-width: 100px; }
    .view-icons { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 8px; }
    .add-prop-button, .copy-props-button, .move-button, .reverse-button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 4px 8px; cursor: pointer; border-radius: 3px; }
    .add-prop-button:hover, .copy-props-button:hover, .move-button:hover, .reverse-button:hover { background: var(--vscode-button-hoverBackground); }
    .add-prop-button:disabled, .copy-props-button:disabled, .move-button:disabled, .reverse-button:disabled { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); opacity: 0.6; cursor: not-allowed; }

    /* Match forms output vars layout: list (left), buttons under, details (right) */
    .view-content { display: none; }
    .view-content.active { display: block; }
    .list-container { width: 30%; float: left; padding-right: 15px; }
    .list-container select { width: 100%; height: 200px; margin-bottom: 10px; }
    .list-buttons { margin-top: 10px; display: flex; gap: 8px; }
    .list-buttons button { padding: 6px 12px; background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 3px; cursor: pointer; font-size: 12px; }
    .details-container { width: 65%; float: left; }
    .view-content:after { content: ""; display: table; clear: both; }
    .header-container { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .copy-name-button, .view-preview-button, .edit-owner-button { background: transparent; border: none; color: var(--vscode-foreground); cursor: pointer; padding: 6px; border-radius: 4px; }
    .copy-name-button:hover, .view-preview-button:hover, .edit-owner-button:hover { background: var(--vscode-toolbar-hoverBackground); }
    
    /* Copy Page Init Flow Name Button Styles */
    .copy-page-init-name-button {
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
    
    .copy-page-init-name-button:hover {
        background: var(--vscode-toolbar-hoverBackground) !important;
        background-color: var(--vscode-toolbar-hoverBackground) !important;
    }
    
    .copy-page-init-name-button:active {
        background: var(--vscode-toolbar-activeBackground);
        transform: scale(0.95);
    }
    
    .copy-page-init-name-button .codicon {
        font-size: 16px;
    }

    /* Modal styles */
    .modal { display: none; position: fixed; z-index: 1000; padding-top: 60px; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
    .modal-content { background-color: var(--vscode-editor-background); margin: auto; padding: 20px; border: 1px solid var(--vscode-panel-border); width: 600px; border-radius: 4px; color: var(--vscode-foreground); }
    .close-button { color: var(--vscode-foreground); float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
    .close-button:hover, .close-button:focus { color: var(--vscode-textLink-foreground); text-decoration: none; cursor: pointer; }
    
    /* Modal tabs styling */
    .modal .tabs {
        display: flex;
        gap: 8px;
        border-bottom: 1px solid var(--vscode-panel-border);
        margin-bottom: 15px;
        margin-top: 15px;
    }
    
    .modal .tab {
        padding: 8px 16px;
        cursor: pointer;
        border: 1px solid var(--vscode-panel-border);
        border-bottom: none;
        border-radius: 4px 4px 0 0;
        background: var(--vscode-sideBar-background);
        color: var(--vscode-foreground);
        font-size: 13px;
    }
    
    .modal .tab.active {
        background: var(--vscode-editor-background);
        font-weight: 600;
        color: var(--vscode-panel-title-activeForeground);
    }
    
    .modal .tab:hover {
        background: var(--vscode-toolbar-hoverBackground);
    }
    
    /* Modal tab content styling */
    .modal .tab-content {
        display: none;
        padding: 10px 0;
    }
    
    .modal .tab-content.active {
        display: block;
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
        color: var(--vscode-foreground);
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
    
    /* Modal button styling */
    .modal button {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 10px 16px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 13px;
        font-family: var(--vscode-font-family);
        margin-right: 8px;
        margin-top: 10px;
    }
    
    .modal button:hover {
        background-color: var(--vscode-button-hoverBackground);
    }
    
    .modal button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    /* Validation styles for forms */
    .validation-error {
        color: var(--vscode-errorForeground, #f44336);
        font-size: 12px;
        margin-top: 5px;
        margin-bottom: 10px;
        min-height: 16px;
    }
    
    .modal .field-note {
        display: block;
        margin-top: 5px;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        font-style: italic;
    }
    
    .field-note { font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 4px; }
    `;
}

module.exports = { getDetailViewStyles };
