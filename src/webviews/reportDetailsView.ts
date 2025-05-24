"use strict";

import * as vscode from 'vscode';
import { JsonTreeItem } from '../models/types';

/**
 * Shows report details in a webview
 * @param item The tree item representing the report
 * @param modelService ModelService instance
 */
export function showReportDetails(item: JsonTreeItem, modelService: any): void {
    console.log(`Report details called for ${item.label}`);
    
    try {
        // Instead of requiring from the reports folder at runtime (which fails in production)
        // We'll implement the core functionality directly in this TypeScript file
        
        // Create a normalized panel ID to ensure consistency
        const normalizedLabel = item.label.trim().toLowerCase();
        const panelId = `reportDetails-${normalizedLabel}`;
          // Create webview panel
        const panel = vscode.window.createWebviewPanel(
            "reportDetails", 
            `Details for ${item.label} Report`,
            vscode.ViewColumn.One, 
            { 
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
          // Get the report data from modelService by finding it in all reports
        let reportData = null;
        try {
            // Get all reports from modelService
            const allReports = modelService.getAllReports();
            
            // Find the specific report by name
            reportData = allReports.find(report => report.name === item.label || report.displayName === item.label);
            
            console.log(`Found report data for ${item.label}:`, reportData ? "Report found" : "Report not found");
        } catch (error) {
            console.error(`Error retrieving report data: ${error}`);
        }
          // Generate VS Code themed styles similar to object details view
        const reportViewStyles = `
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                padding: 15px;
                margin: 0;
            }

            /* Tabs styling - matches object details view */
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

            /* Table styling with VS Code theme */
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }

            th, td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid var(--vscode-editorGroup-border);
            }

            th {
                background-color: var(--vscode-editor-lineHighlightBackground);
                color: var(--vscode-editor-foreground);
                font-weight: 600;
            }

            tr:hover {
                background-color: var(--vscode-list-hoverBackground);
            }

            .property-name {
                font-weight: bold;
                width: 30%;
            }

            .property-value {
                width: 70%;
            }

            h1 {
                color: var(--vscode-editor-foreground);
                margin-bottom: 20px;
                font-size: 1.5em;
                font-weight: 600;
            }
        `;
          // Get the settings tab content
        function generateSettingsTab(report: any) {
            if (!report) { return '<div><p>Report data not found</p></div>'; }
            
            const settings = [
                { name: 'Name', value: report.name || '' },
                { name: 'Display Name', value: report.displayName || '' },
                { name: 'Description', value: report.description || '' },
                { name: 'Is Default', value: report.isDefault ? 'Yes' : 'No' },
                { name: 'Is Visible', value: report.isVisible !== false ? 'Yes' : 'No' },
                { name: 'Type', value: report.type || '' },
                { name: 'API URL', value: report.apiUrl || '' },
                { name: 'Method', value: report.method || 'GET' },
                { name: 'Icon', value: report.icon || '' }
            ];
            
            let content = '<table>';
            content += '<tr><th>Property</th><th>Value</th></tr>';
            
            for (const setting of settings) {
                content += `
                    <tr>
                        <td class="property-name">${setting.name}</td>
                        <td class="property-value">${setting.value}</td>
                    </tr>
                `;
            }
            
            content += '</table>';
            return content;
        }
        
        // Get the columns tab content
        function generateColumnsTab(report: any) {
            if (!report || !report.reportColumn || report.reportColumn.length === 0) {
                return '<div><p>No columns defined for this report</p></div>';
            }
            
            let content = '<table>';
            content += '<tr><th>Display Name</th><th>Field</th><th>Width</th><th>Type</th><th>Is Visible</th></tr>';
            
            for (const column of report.reportColumn) {
                content += `
                    <tr>
                        <td>${column.displayName || ''}</td>
                        <td>${column.field || ''}</td>
                        <td>${column.width || ''}</td>
                        <td>${column.type || ''}</td>
                        <td>${column.isVisible !== false ? 'Yes' : 'No'}</td>
                    </tr>
                `;
            }
            
            content += '</table>';
            return content;
        }
        
        // Get the buttons tab content
        function generateButtonsTab(report: any) {
            if (!report || !report.reportButton || report.reportButton.length === 0) {
                return '<div><p>No buttons defined for this report</p></div>';
            }
            
            let content = '<table>';
            content += '<tr><th>Display Name</th><th>Action</th><th>Is Default</th><th>Access Key</th><th>Is Visible</th></tr>';
            
            for (const button of report.reportButton) {
                content += `
                    <tr>
                        <td>${button.displayName || ''}</td>
                        <td>${button.action || ''}</td>
                        <td>${button.isDefault ? 'Yes' : 'No'}</td>
                        <td>${button.accessKey || ''}</td>
                        <td>${button.isVisible !== false ? 'Yes' : 'No'}</td>
                    </tr>
                `;
            }
            
            content += '</table>';
            return content;
        }
        
        // Get the parameters tab content
        function generateParamsTab(report: any) {
            if (!report || !report.reportParam || report.reportParam.length === 0) {
                return '<div><p>No parameters defined for this report</p></div>';
            }
            
            let content = '<table>';
            content += '<tr><th>Name</th><th>Display Name</th><th>Type</th><th>Default Value</th><th>Is Required</th></tr>';
            
            for (const param of report.reportParam) {
                content += `
                    <tr>
                        <td>${param.name || ''}</td>
                        <td>${param.displayName || ''}</td>
                        <td>${param.type || ''}</td>
                        <td>${param.defaultValue || ''}</td>
                        <td>${param.isRequired ? 'Yes' : 'No'}</td>
                    </tr>
                `;
            }
            
            content += '</table>';
            return content;
        }
          // Script for tab switching - matches object details view pattern
        const tabScript = `
            document.addEventListener('DOMContentLoaded', function() {
                // Add click event listeners to all tabs
                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(tab => {
                    tab.addEventListener('click', function() {
                        const tabName = this.getAttribute('data-tab');
                        openTab(this, tabName);
                    });
                });
                
                // Set the first tab as active on load
                if (tabs.length > 0) {
                    const firstTab = tabs[0];
                    const firstTabName = firstTab.getAttribute('data-tab');
                    openTab(firstTab, firstTabName);
                }
            });
            
            function openTab(tabElement, tabName) {
                // Hide all tab contents
                const tabContents = document.getElementsByClassName('tab-content');
                for (let i = 0; i < tabContents.length; i++) {
                    tabContents[i].classList.remove('active');
                }
                
                // Remove active class from all tabs
                const tabs = document.getElementsByClassName('tab');
                for (let i = 0; i < tabs.length; i++) {
                    tabs[i].classList.remove('active');
                }
                
                // Show the clicked tab content and mark tab as active
                const targetContent = document.getElementById(tabName);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                if (tabElement) {
                    tabElement.classList.add('active');
                }
            }
        `;// Set HTML content with actual report data if found, or show error message
        if (reportData) {
            // Calculate counts for tabs
            const columnCount = reportData.reportColumn ? reportData.reportColumn.length : 0;
            const buttonCount = reportData.reportButton ? reportData.reportButton.length : 0;
            const paramCount = reportData.reportParam ? reportData.reportParam.length : 0;
            
            // Report data found, show the full UI with object details view styling
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Report Details: ${item.label}</title>
                    <style>
                        ${reportViewStyles}
                    </style>
                </head>
                <body>
                    <h1>Details for ${item.label} Report</h1>
                    
                    <div class="tabs">
                        <div class="tab active" data-tab="settings">Settings</div>
                        <div class="tab" data-tab="columns">Columns (${columnCount})</div>
                        <div class="tab" data-tab="buttons">Buttons (${buttonCount})</div>
                        <div class="tab" data-tab="params">Parameters (${paramCount})</div>
                    </div>
                    
                    <div id="settings" class="tab-content active">
                        ${generateSettingsTab(reportData)}
                    </div>
                    
                    <div id="columns" class="tab-content">
                        ${generateColumnsTab(reportData)}
                    </div>
                    
                    <div id="buttons" class="tab-content">
                        ${generateButtonsTab(reportData)}
                    </div>
                    
                    <div id="params" class="tab-content">
                        ${generateParamsTab(reportData)}
                    </div>
                    
                    <script>${tabScript}</script>
                </body>
                </html>
            `;        } else {
            // Report data not found, show error message with VS Code themed styling
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Report Details: ${item.label} - Not Found</title>
                    <style>
                        body {
                            font-family: var(--vscode-font-family);
                            color: var(--vscode-editor-foreground);
                            background-color: var(--vscode-editor-background);
                            padding: 15px;
                            margin: 0;
                        }
                        
                        h1 {
                            color: var(--vscode-editor-foreground);
                            margin-bottom: 20px;
                            font-size: 1.5em;
                            font-weight: 600;
                        }
                        
                        .error-container { 
                            padding: 20px;
                            background-color: var(--vscode-inputValidation-errorBackground);
                            border-left: 4px solid var(--vscode-inputValidation-errorBorder);
                            color: var(--vscode-inputValidation-errorForeground);
                            margin-bottom: 20px;
                            border-radius: 3px;
                        }
                        
                        .error-title {
                            color: var(--vscode-errorForeground);
                            margin-top: 0;
                        }
                        
                        .tip {
                            padding: 15px;
                            background-color: var(--vscode-inputValidation-infoBackground);
                            border-left: 4px solid var(--vscode-inputValidation-infoBorder);
                            color: var(--vscode-inputValidation-infoForeground);
                            border-radius: 3px;
                        }
                        
                        h3 { 
                            margin-top: 25px;
                            color: var(--vscode-editor-foreground);
                        }
                        
                        code {
                            background-color: var(--vscode-textCodeBlock-background);
                            color: var(--vscode-textPreformat-foreground);
                            padding: 2px 5px;
                            border-radius: 3px;
                            font-family: var(--vscode-editor-font-family);
                        }
                        
                        ul {
                            color: var(--vscode-editor-foreground);
                        }
                        
                        p {
                            color: var(--vscode-editor-foreground);
                        }
                    </style>
                </head>
                <body>
                    <h1>Details for ${item.label} Report</h1>
                    
                    <div class="error-container">
                        <h2 class="error-title">Report Not Found</h2>
                        <p>The report with name "${item.label}" could not be found in the current model.</p>
                    </div>
                    
                    <div class="tip">
                        <h3>Troubleshooting Tips:</h3>
                        <ul>
                            <li>Check if the report exists in the App DNA file</li>
                            <li>Verify that the report name matches exactly (case-sensitive)</li>
                            <li>Try refreshing the view using the refresh button in the sidebar</li>
                            <li>Check if the model was loaded correctly</li>
                        </ul>
                    </div>
                    
                    <h3>Technical Details</h3>
                    <p>Item label: <code>${item.label}</code></p>
                    <p>Item context value: <code>${item.contextValue || "undefined"}</code></p>
                    <p>Model loaded: <code>${modelService.isFileLoaded() ? "Yes" : "No"}</code></p>
                </body>
                </html>
            `;
        }
        
    } catch (error) {
        console.error("Error showing report details:", error);
        vscode.window.showErrorMessage(`Failed to show report details: ${error}`);
    }
}

/**
 * Refreshes all open report details webviews with the latest model data
 */
export function refreshAll(): void {
    // To be implemented
    console.log("refreshAll called");
}

/**
 * Gets currently open panel items
 * @returns Array of open panel items
 */
export function getOpenPanelItems(): JsonTreeItem[] {
    // To be implemented
    console.log("getOpenPanelItems called");
    return [];
}

/**
 * Closes all open panels
 */
export function closeAllPanels(): void {
    // To be implemented
    console.log("closeAllPanels called");
}
