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
    .form-row { display: grid; grid-template-columns: 220px 1fr auto; align-items: center; gap: 8px; margin-bottom: 8px; }
    label { font-weight: 500; }
    input[type="text"], select { padding: 4px 8px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 2px; }
    .control-with-checkbox { display: flex; align-items: center; gap: 8px; }
    .view-icons { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 8px; }
    .add-prop-button, .copy-props-button, .move-button, .reverse-button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 4px 8px; cursor: pointer; border-radius: 3px; }
    .add-prop-button:hover, .copy-props-button:hover, .move-button:hover, .reverse-button:hover { background: var(--vscode-button-hoverBackground); }
    .list-container { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
    .list-buttons { display: flex; flex-direction: column; gap: 6px; }
    select[size="10"] { width: 100%; }
    .details-container { border-top: 1px solid var(--vscode-panel-border); padding-top: 10px; }
    .header-container { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .copy-name-button, .view-preview-button, .edit-owner-button { background: transparent; border: none; color: var(--vscode-foreground); cursor: pointer; padding: 6px; border-radius: 4px; }
    .copy-name-button:hover, .view-preview-button:hover, .edit-owner-button:hover { background: var(--vscode-toolbar-hoverBackground); }

    /* Modal styles */
    .modal { display: none; position: fixed; z-index: 1000; padding-top: 60px; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
    .modal-content { background-color: var(--vscode-editor-background); margin: auto; padding: 20px; border: 1px solid var(--vscode-panel-border); width: 600px; border-radius: 4px; color: var(--vscode-foreground); }
    .close-button { color: var(--vscode-foreground); float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
    .close-button:hover, .close-button:focus { color: var(--vscode-textLink-foreground); text-decoration: none; cursor: pointer; }
    .field-note { font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 4px; }
    `;
}

module.exports = { getDetailViewStyles };
