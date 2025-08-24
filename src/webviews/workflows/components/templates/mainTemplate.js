"use strict";
const { getDetailViewStyles } = require("../../styles/detailsViewStyles");

function getMainTemplate(flow, settingsHtml, codiconsUri, ownerObject = null) {
    const flowName = flow && (flow.titleText || flow.name) ? (flow.titleText || flow.name) : 'Unknown Workflow';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workflow Details: ${flowName}</title>
    <link href="${codiconsUri}" rel="stylesheet" />
    <style>
        ${getDetailViewStyles()}
    </style>
    </head>
<body>
    <div class="header-container">
        <h1 class="header-title">Details for ${flowName} Workflow</h1>
        <button class="copy-workflow-name-button" onclick="copyWorkflowName('${flowName || ''}')" title="Copy Workflow Name">
            <i class="codicon codicon-copy"></i>
        </button>
    </div>

    ${ownerObject ? `
    <div class="owner-data-object-section">
        <span class="owner-data-object-label">Owner Data Object:</span>
        <span class="owner-data-object-name">${ownerObject.name || 'Unknown Object'}</span>
    </div>
    ` : ''}

    <div class="tabs" role="tablist">
        <div class="tab active" role="tab" tabindex="0" data-tab="settings">Settings</div>
        <!-- Future tabs go here -->
    </div>

    <div id="settings" class="tab-content active">
        ${settingsHtml}
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const flow = ${JSON.stringify(flow)};

        function copyWorkflowName(flowName) {
            if (!flowName) { return; }
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(flowName).then(() => {
                        const icon = document.querySelector('.copy-workflow-name-button .codicon');
                        if (icon) {
                            const original = icon.className;
                            icon.className = 'codicon codicon-check';
                            setTimeout(() => { icon.className = original; }, 1500);
                        }
                    }).catch(() => {});
                }
            } catch {}
        }

        // Basic tab switching (future-proofing for when more tabs are added)
        document.addEventListener('click', (e) => {
            const tab = e.target && e.target.classList && e.target.classList.contains('tab') ? e.target : null;
            if (!tab) return;
            const tabName = tab.getAttribute('data-tab');
            if (!tabName) return;
            document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            const content = document.getElementById(tabName);
            if (content) content.classList.add('active');
        });

        // Wire up settings change handlers
        document.addEventListener('change', (e) => {
            const target = e.target;
            if (!target) return;
            if (target.classList && target.classList.contains('setting-checkbox')) {
                const prop = target.getAttribute('data-prop');
                const field = document.getElementById('setting-' + prop);
                if (target.checked) {
                    if (field) { field.removeAttribute('readonly'); field.removeAttribute('disabled'); }
                    vscode.postMessage({ command: 'updateSettings', data: { property: prop, exists: true, value: field ? field.value : null } });
                } else {
                    if (field) { field.setAttribute('readonly', 'true'); field.setAttribute('disabled', 'true'); }
                    vscode.postMessage({ command: 'updateSettings', data: { property: prop, exists: false, value: null } });
                }
            }
            if (target.id && target.id.startsWith('setting-')) {
                const name = target.id.replace('setting-', '');
                const chk = document.querySelector('.setting-checkbox[data-prop="' + name + '"]');
                if (chk && chk.hasAttribute('data-originally-checked')) {
                    vscode.postMessage({ command: 'updateSettings', data: { property: name, exists: true, value: target.value } });
                }
            }
        });
    </script>
</body>
</html>`;
}

module.exports = { getMainTemplate };
