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
            `Report: ${item.label}`,
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
        
        // Generate styled tabs
        const tabStyles = `
            .tab-container {
                border-bottom: 1px solid #ccc;
                display: flex;
                margin-bottom: 20px;
            }
            .tab {
                padding: 10px 20px;
                cursor: pointer;
                border: 1px solid transparent;
                border-bottom: none;
                background-color: #f8f8f8;
                margin-right: 5px;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
            }
            .tab.active {
                background-color: white;
                border-color: #ccc;
                border-bottom: 1px solid white;
                margin-bottom: -1px;
            }
            .tab-content {
                display: none;
                padding: 20px;
                border: 1px solid #ccc;
                border-top: none;
            }
            .tab-content.active {
                display: block;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            th, td {
                text-align: left;
                padding: 8px;
                border-bottom: 1px solid #ddd;
            }
            th {
                background-color: #f2f2f2;
            }
            tr:hover {
                background-color: #f5f5f5;
            }
            .property-name {
                font-weight: bold;
                width: 30%;
            }
            .property-value {
                width: 70%;
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
        
        // Script for tab switching
        const tabScript = `
            function openTab(evt, tabName) {
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
                document.getElementById(tabName).classList.add('active');
                evt.currentTarget.classList.add('active');
            }
            
            // Set the first tab as active on load
            document.addEventListener('DOMContentLoaded', function() {
                document.querySelector('.tab').click();
            });
        `;
          // Set HTML content with actual report data if found, or show error message
        if (reportData) {
            // Report data found, show the full UI
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Report: ${item.label}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #0078D7; margin-bottom: 20px; }
                        ${tabStyles}
                    </style>
                </head>
                <body>
                    <h1>Report: ${item.label}</h1>
                    
                    <div class="tab-container">
                        <div class="tab active" onclick="openTab(event, 'settings')">Settings</div>
                        <div class="tab" onclick="openTab(event, 'columns')">Columns</div>
                        <div class="tab" onclick="openTab(event, 'buttons')">Buttons</div>
                        <div class="tab" onclick="openTab(event, 'params')">Parameters</div>
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
            `;
        } else {
            // Report data not found, show error message with troubleshooting info
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Report: ${item.label} - Not Found</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #0078D7; margin-bottom: 20px; }
                        .error-container { 
                            padding: 20px;
                            background-color: #f8f8f8;
                            border-left: 4px solid #e74c3c;
                            margin-bottom: 20px;
                        }
                        .error-title {
                            color: #e74c3c;
                            margin-top: 0;
                        }
                        .tip {
                            padding: 15px;
                            background-color: #f0f7fb;
                            border-left: 4px solid #3498db;
                        }
                        h3 { margin-top: 25px; }
                        code {
                            background-color: #f1f1f1;
                            padding: 2px 5px;
                            border-radius: 3px;
                            font-family: Consolas, monospace;
                        }
                    </style>
                </head>
                <body>
                    <h1>Report Details</h1>
                    
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
