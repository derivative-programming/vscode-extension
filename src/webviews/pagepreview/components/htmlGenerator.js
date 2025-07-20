// htmlGenerator.js
// HTML generator for page preview view
// Generates HTML content with role filtering and form/report dropdown
// Created: July 20, 2025

"use strict";

/**
 * Generates the complete HTML content for the page preview view
 * @param {Array} allObjects Array of all objects from model
 * @returns {string} Complete HTML content for the webview
 */
function generateHTMLContent(allObjects) {
    // Extract unique roles and check for public pages from objectWorkflow and report objects
    const uniqueRoles = new Set();
    let hasPublicPages = false;
    
    allObjects.forEach(obj => {
        // Check objectWorkflow items with isPage=true
        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
            obj.objectWorkflow.forEach(workflow => {
                if (workflow.isPage === "true") {
                    if (workflow.roleRequired) {
                        uniqueRoles.add(workflow.roleRequired);
                    } else {
                        hasPublicPages = true;
                    }
                }
            });
        }
        
        // Check report items with isPage=true
        if (obj.report && Array.isArray(obj.report)) {
            obj.report.forEach(report => {
                if (report.isPage === "true") {
                    if (report.roleRequired) {
                        uniqueRoles.add(report.roleRequired);
                    } else {
                        hasPublicPages = true;
                    }
                }
            });
        }
    });
    
    const uniqueRolesArray = Array.from(uniqueRoles);
    
    console.log('[DEBUG] PagePreview HTML Generator - Unique roles:', uniqueRolesArray);
    console.log('[DEBUG] PagePreview HTML Generator - Has public pages:', hasPublicPages);
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Page Preview</title>
        ${generateCSS()}
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Page Preview</h1>
            </div>
            
            <div class="content">
                <!-- Role Filter Section -->
                <div class="filter-section">
                    <h3 class="filter-title">Filter by Role</h3>
                    <div class="role-filter-options" id="roleFilterOptions">
                        ${generateRoleFilterHTML(uniqueRolesArray, hasPublicPages)}
                    </div>
                </div>
                
                <!-- Page Selection Section -->
                <div class="selection-section">
                    <h3 class="selection-title">Select Page</h3>
                    <select class="page-dropdown" id="pageDropdown" onchange="handlePageSelection()">
                        <option value="">Select a page to preview...</option>
                    </select>
                </div>
                
                <!-- Preview Section -->
                <div class="preview-section" id="previewSection" style="display: none;">
                    <h3 class="preview-title">Page Preview</h3>
                    <div class="preview-content" id="previewContent">
                        <!-- Form/report preview will be generated here -->
                    </div>
                </div>
                
                <!-- View Details Section -->
                <div class="view-details-section" id="viewDetailsSection" style="display: none;">
                    <button class="view-details-button" id="viewDetailsButton" onclick="handleViewDetails()">
                        View Full Page Details
                    </button>
                </div>
            </div>
        </div>
        
        ${generateJavaScript(allObjects)}
    </body>
    </html>
    `;
}

/**
 * Generates CSS styles for the page preview view
 * @returns {string} CSS style block
 */
function generateCSS() {
    return `
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            font-weight: var(--vscode-font-weight);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .header h1 {
            margin: 0;
            color: var(--vscode-foreground);
            font-size: 24px;
            font-weight: 600;
        }
        
        .content {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }
        
        /* Role Filter Styles */
        .filter-section {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
        }
        
        .filter-title, .selection-title, .preview-title {
            margin: 0 0 15px 0;
            color: var(--vscode-foreground);
            font-size: 16px;
            font-weight: 600;
        }
        
        .role-filter-options {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .role-checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            padding: 8px 12px;
            min-width: 120px;
        }
        
        .role-checkbox-item input[type="checkbox"] {
            margin: 0;
            width: 16px;
            height: 16px;
        }
        
        .role-checkbox-item label {
            margin: 0;
            cursor: pointer;
            font-size: 13px;
            color: var(--vscode-foreground);
            user-select: none;
        }
        
        /* Page Selection Styles */
        .selection-section {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
        }
        
        .page-dropdown {
            width: 100%;
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 13px;
            cursor: pointer;
        }
        
        .page-dropdown:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }
        
        /* Preview Section Styles */
        .preview-section {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
        }
        
        .preview-content {
            min-height: 300px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            padding: 20px;
        }
        
        /* Page Preview Container Styles */
        .page-preview-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        .page-breadcrumb {
            margin-bottom: 15px;
            font-size: 14px;
        }

        .breadcrumb-nav {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .breadcrumb-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .breadcrumb-button {
            background: none;
            border: none;
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 13px;
            transition: background-color 0.2s;
        }

        .breadcrumb-button:hover {
            background-color: var(--vscode-list-hoverBackground);
            text-decoration: underline;
        }

        .breadcrumb-separator {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            user-select: none;
        }

        /* Back button styles */
        .back-button-section {
            margin: 15px 0 20px 0;
        }

        .back-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border, transparent);
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            transition: background-color 0.2s;
        }

        .back-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .back-button-icon {
            font-size: 14px;
            font-weight: bold;
        }

        .page-header {
            margin-bottom: 30px;
        }

        .page-title {
            font-size: 24px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin: 0 0 12px 0;
        }

        .page-intro {
            font-size: 16px;
            color: var(--vscode-foreground);
            margin: 0 0 12px 0;
            line-height: 1.5;
        }

        .page-meta {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin: 0;
            font-style: italic;
        }

        /* Form Preview Styles */
        .form-preview {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
            margin-top: 20px;
        }

        .form-header {
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        
        .form-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin: 0 0 8px 0;
        }
        
        .form-intro {
            font-size: 14px;
            color: var(--vscode-foreground);
            margin: 0;
            line-height: 1.4;
        }

        .form-subtitle {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin: 0;
        }
        
        .form-section {
            margin-bottom: 25px;
        }
        
        .form-section-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin: 0 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .form-field {
            display: flex;
            flex-direction: column;
            gap: 5px;
            margin-bottom: 15px;
        }
        
        .form-field-label {
            font-size: 13px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }
        
        .form-field-input {
            padding: 8px 12px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 13px;
            font-family: var(--vscode-editor-font-family);
        }

        .form-field-textarea {
            min-height: 80px;
            resize: vertical;
            font-family: var(--vscode-editor-font-family);
        }
        
        .form-field-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }
        
        .form-field-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        
        .checkbox-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .form-field-checkbox {
            width: 16px;
            height: 16px;
            margin: 0;
        }
        
        .checkbox-label {
            font-size: 13px;
            color: var(--vscode-foreground);
            user-select: none;
        }
        
        .form-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 30px;
            padding-top: 20px;
        }
        
        .form-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border, transparent);
            padding: 10px 20px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        
        .form-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .form-button.primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .form-button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        /* View Details Section */
        .view-details-section {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
            text-align: center;
        }
        
        .view-details-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border, transparent);
            padding: 12px 24px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        
        .view-details-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        /* Report Grid Styles */
        .report-grid-container {
            margin: 20px 0;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow-x: auto;
            overflow-y: hidden;
            background-color: var(--vscode-editor-background);
        }
        
        .report-grid {
            width: 100%;
            min-width: 600px; /* Minimum width to trigger horizontal scroll */
            border-collapse: collapse;
            margin: 0;
            background-color: var(--vscode-editor-background);
        }
        
        .report-grid th {
            background-color: var(--vscode-list-hoverBackground);
            color: var(--vscode-foreground);
            font-weight: 600;
            padding: 12px 15px;
            text-align: left;
            border-bottom: 2px solid var(--vscode-panel-border);
            border-right: 1px solid var(--vscode-panel-border);
            font-size: 13px;
            position: relative;
            cursor: pointer;
            user-select: none;
        }
        
        .report-grid th:hover {
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        .report-grid th.sortable::after {
            content: '↕';
            position: absolute;
            right: 8px;
            opacity: 0.5;
            font-size: 11px;
        }
        
        .report-grid th.sortable.sort-asc::after {
            content: '↑';
            opacity: 1;
        }
        
        .report-grid th.sortable.sort-desc::after {
            content: '↓';
            opacity: 1;
        }
        
        .report-grid th:last-child {
            border-right: none;
        }
        
        .report-grid th.row-number {
            width: 60px;
            text-align: center;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
        }
        
        .report-grid td {
            padding: 10px 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
            border-right: 1px solid var(--vscode-panel-border);
            color: var(--vscode-foreground);
            font-size: 13px;
            vertical-align: top;
        }
        
        .report-grid td:last-child {
            border-right: none;
        }
        
        .report-grid td.button-cell {
            padding: 8px 10px;
            text-align: center;
            vertical-align: middle;
        }
        
        .grid-action-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border, transparent);
            padding: 4px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background-color 0.2s;
            width: 100%;
        }
        
        .grid-action-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .grid-action-btn:active {
            background-color: var(--vscode-button-background);
            opacity: 0.8;
        }
        
        .grid-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .grid-action-btn.async-btn {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .grid-action-btn.async-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        /* Data checkbox styles */
        .data-checkbox {
            cursor: default;
            accent-color: var(--vscode-checkbox-border);
            margin: 0;
            vertical-align: middle;
        }
        
        .data-checkbox:disabled {
            opacity: 0.8;
            cursor: default;
        }
        
        .report-grid td.row-number {
            text-align: center;
            font-weight: 500;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            color: var(--vscode-descriptionForeground);
        }
        
        .report-grid tbody tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .report-grid tbody tr:nth-child(even) {
            background-color: var(--vscode-list-inactiveSelectionBackground);
        }
        
        .report-grid tbody tr:hover td.row-number {
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        .report-grid-footer {
            padding: 10px 15px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-top: 1px solid var(--vscode-panel-border);
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
        }
        
        .pagination-left {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        
        .pagination-center {
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: center;
            flex-grow: 1;
        }
        
        .pagination-right {
            display: flex;
            align-items: center;
            flex-shrink: 0;
        }
        
        .pagination-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin: 0;
        }
        
        .pagination-select {
            padding: 4px 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 12px;
            cursor: pointer;
        }
        
        .pagination-btn {
            padding: 4px 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border, transparent);
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: background-color 0.2s;
            min-width: 32px;
            text-align: center;
        }
        
        .pagination-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .pagination-info {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin: 0 8px;
        }
        
        .row-count-info {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .report-grid-empty {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        
        /* Responsive design for grid */
        @media (max-width: 768px) {
            .report-grid th,
            .report-grid td {
                padding: 8px 10px;
                font-size: 12px;
            }
            
            .report-grid th.row-number,
            .report-grid td.row-number {
                width: 40px;
                padding: 8px 5px;
            }
        }
        
        /* Report Detail Two-Column Styles */
        .report-detail-container {
            margin: 20px 0;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow-x: auto;
            overflow-y: hidden;
            background-color: var(--vscode-editor-background);
        }
        
        .report-detail-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            background-color: var(--vscode-editor-background);
        }
        
        .report-detail-table td.detail-header {
            background-color: var(--vscode-list-hoverBackground);
            font-weight: 600;
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            border-right: 1px solid var(--vscode-panel-border);
            padding: 12px 15px;
            text-align: left;
            vertical-align: top;
            width: 30%;
            min-width: 150px;
        }
        
        .report-detail-table td.detail-value {
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding: 12px 15px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
            width: 70%;
        }
        
        .report-detail-table tbody tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .report-detail-table tbody tr:hover td.detail-header {
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        /* Responsive design for detail table */
        @media (max-width: 768px) {
            .report-detail-table td.detail-header,
            .report-detail-table td.detail-value {
                padding: 10px 12px;
                font-size: 12px;
            }
            
            .report-detail-table td.detail-header {
                width: 40%;
                min-width: 120px;
            }
            
            .report-detail-table td.detail-value {
                width: 60%;
            }
        }
        
        /* Report Detail Three-Column Styles */
        .report-detail-three-container {
            margin: 20px 0;
            display: flex;
            gap: 20px;
            align-items: flex-start;
        }
        
        .detail-data-section {
            flex: 2;
            min-width: 0;
        }
        
        .detail-buttons-section {
            flex: 1;
            min-width: 250px;
        }
        
        .report-detail-buttons-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
        }
        
        .report-detail-buttons-table td.detail-button-single {
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding: 12px 15px;
            text-align: center;
            vertical-align: middle;
            width: 100%;
        }
        
        .report-detail-buttons-table tbody tr:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .report-detail-buttons-table tbody tr:hover td.detail-button-single {
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        /* Responsive design for three-column detail */
        @media (max-width: 768px) {
            .report-detail-three-container {
                flex-direction: column;
                gap: 15px;
            }
            
            .detail-data-section {
                flex: none;
            }
            
            .detail-buttons-section {
                flex: none;
                min-width: auto;
            }
            
            .report-detail-buttons-table td.detail-button-single {
                padding: 10px 12px;
                font-size: 12px;
            }
        }
        
        .report-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 15px 0;
            padding: 10px;
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            font-size: 13px;
            color: var(--vscode-foreground);
        }
        
        .report-filters {
            margin: 15px 0;
            padding: 15px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
        }
        
        .filter-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            cursor: pointer;
        }
        
        .filter-title {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
            cursor: pointer;
            user-select: none;
        }
        
        .filter-collapse-button {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            font-size: 12px;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 3px;
            transition: background-color 0.2s;
        }
        
        .filter-collapse-button:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
        }
        
        .filter-content {
            display: block;
        }
        
        .report-filters h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .filter-row {
            display: flex;
            gap: 15px;
            align-items: center;
            margin-bottom: 10px;
            flex-wrap: wrap;
        }
        
        .filter-field {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 150px;
        }
        
        .filter-label {
            font-size: 12px;
            color: var(--vscode-foreground);
            font-weight: 500;
        }
        
        .filter-input {
            padding: 6px 10px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 12px;
        }
        
        .filter-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }
        
        .filter-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 15px;
            padding-top: 10px;
        }
        
        .filter-action-button {
            padding: 6px 12px;
            border: none;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s, opacity 0.2s;
            min-width: 60px;
        }
        
        .filter-action-button.primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .filter-action-button.primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .filter-action-button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .filter-action-button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .filter-action-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* Empty state */
        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            padding: 40px 20px;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            
            .header {
                flex-direction: column;
                gap: 15px;
                align-items: flex-start;
            }
            
            .role-filter-options {
                flex-direction: column;
            }
            
            .role-checkbox-item {
                min-width: auto;
            }
            
            .form-buttons {
                flex-direction: column;
                align-items: stretch;
            }
        }
        
        .report-action-buttons {
            margin-bottom: 20px;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-widget-border);
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .report-action-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border, transparent);
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .report-action-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .report-action-btn:active {
            background-color: var(--vscode-button-background);
            opacity: 0.8;
        }
        
        .report-action-btn:disabled {
            background-color: var(--vscode-button-background);
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .report-action-btn.add-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .report-action-btn.add-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .action-button-icon {
            font-size: 14px;
            font-weight: bold;
        }
        
        .report-export-section {
            padding: 10px;
            border-top: 1px solid var(--vscode-widget-border);
            background-color: var(--vscode-editor-background);
            display: flex;
            justify-content: flex-end;
        }
        
        .export-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border, transparent);
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .export-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .export-button:active {
            background-color: var(--vscode-button-background);
            opacity: 0.8;
        }
        
        .export-icon {
            font-size: 14px;
        }
        
        .export-text {
            font-size: 13px;
        }
    </style>
    `;
}

/**
 * Generates HTML for role filter checkboxes
 * @param {Array} uniqueRoles Array of unique role names
 * @param {boolean} hasPublicPages Whether there are pages without role requirements
 * @returns {string} HTML for role filter options
 */
function generateRoleFilterHTML(uniqueRoles, hasPublicPages) {
    let html = '';
    
    // Add public pages option if available
    if (hasPublicPages) {
        html += `
            <div class="role-checkbox-item">
                <input type="checkbox" id="role-PUBLIC" checked onchange="handleRoleChange(this)">
                <label for="role-PUBLIC">Public Pages</label>
            </div>
        `;
    }
    
    // Add specific roles with proper escaping
    uniqueRoles.forEach(role => {
        // Escape role name for use in HTML id and JavaScript
        const escapedRole = role.replace(/[^a-zA-Z0-9-_]/g, '_');
        const escapedRoleForJS = role.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        html += `
            <div class="role-checkbox-item">
                <input type="checkbox" id="role-${escapedRole}" checked onchange="handleRoleChange(this)" data-role="${escapedRoleForJS}">
                <label for="role-${escapedRole}">${role}</label>
            </div>
        `;
    });
    
    return html;
}

/**
 * Generates JavaScript code for the page preview view
 * @param {Array} allObjects Array of all objects from model (containing objectWorkflow and report arrays)
 * @returns {string} JavaScript code block
 */
function generateJavaScript(allObjects) {
    // Extract all pages (objectWorkflow and report items with isPage="true") directly from objects
    const allPages = [];
    const uniqueRoles = new Set();
    
    allObjects.forEach(obj => {
        // Extract form pages from objectWorkflow
        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
            obj.objectWorkflow.forEach(workflow => {
                if (workflow.isPage === "true") {
                    allPages.push({
                        ...workflow,
                        objectName: obj.name,
                        pageType: 'form'
                    });
                    if (workflow.roleRequired) {
                        uniqueRoles.add(workflow.roleRequired);
                    }
                }
            });
        }
        
        // Extract report pages from report
        if (obj.report && Array.isArray(obj.report)) {
            obj.report.forEach(report => {
                if (report.isPage === "true") {
                    allPages.push({
                        ...report,
                        objectName: obj.name,
                        pageType: 'report'
                    });
                    if (report.roleRequired) {
                        uniqueRoles.add(report.roleRequired);
                    }
                }
            });
        }
    });

    return `
    <script>
        // Global variables
        let allPages = ${JSON.stringify(allPages, null, 2)};
        let allObjects = ${JSON.stringify(allObjects || [], null, 2)};
        let selectedRoles = new Set(['PUBLIC', ${Array.from(uniqueRoles).map(r => `'${r}'`).join(', ')}]);
        let currentSelectedPage = null;
        
        console.log('[DEBUG] PagePreview - Initialized with pages:', allPages);
        console.log('[DEBUG] PagePreview - Initialized with objects:', allObjects);
        console.log('[DEBUG] PagePreview - Initial selected roles:', Array.from(selectedRoles));
        
        // Determine if a page is a form or report by searching through all objects
        function determinePageType(pageName) {
            console.log('[DEBUG] PagePreview - Determining type for page:', pageName);
            
            // Search through all objects for this page name
            for (const obj of allObjects) {
                // Check if it's a report
                if (obj.report && Array.isArray(obj.report)) {
                    const foundReport = obj.report.find(report => 
                        report.name === pageName && report.isPage === "true"
                    );
                    if (foundReport) {
                        console.log('[DEBUG] PagePreview - Found as report in object:', obj.name);
                        return 'report';
                    }
                }
                
                // Check if it's a form (objectWorkflow)
                if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                    const foundForm = obj.objectWorkflow.find(workflow => 
                        workflow.name === pageName && workflow.isPage === "true"
                    );
                    if (foundForm) {
                        console.log('[DEBUG] PagePreview - Found as form in object:', obj.name);
                        return 'form';
                    }
                }
            }
            
            console.warn('[WARN] PagePreview - Could not find page type for:', pageName);
            return null;
        }
        
        // Get the actual objectWorkflow or report object for a page
        function getPageObject(pageName) {
            console.log('[DEBUG] PagePreview - Getting page object for:', pageName);
            
            // Search through all objects for this page name
            for (const obj of allObjects) {
                // Check if it's a report
                if (obj.report && Array.isArray(obj.report)) {
                    const foundReport = obj.report.find(report => 
                        report.name === pageName && report.isPage === "true"
                    );
                    if (foundReport) {
                        console.log('[DEBUG] PagePreview - Found report object:', foundReport.name);
                        return { ...foundReport, objectName: obj.name, pageType: 'report' };
                    }
                }
                
                // Check if it's a form (objectWorkflow)
                if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
                    const foundForm = obj.objectWorkflow.find(workflow => 
                        workflow.name === pageName && workflow.isPage === "true"
                    );
                    if (foundForm) {
                        console.log('[DEBUG] PagePreview - Found form object:', foundForm.name);
                        return { ...foundForm, objectName: obj.name, pageType: 'form' };
                    }
                }
            }
            
            console.warn('[WARN] PagePreview - Could not find page object for:', pageName);
            return null;
        }
        
        // Initialize the view
        document.addEventListener('DOMContentLoaded', function() {
            console.log('[DEBUG] PagePreview - DOM loaded, initializing...');
            updatePageDropdown();
        });
        
        // Handle role filter changes
        function handleRoleChange(checkbox) {
            console.log('[DEBUG] PagePreview - Role change:', checkbox.id, 'checked:', checkbox.checked);
            
            // Get role value from data attribute, fallback to parsing ID for PUBLIC
            const roleValue = checkbox.getAttribute('data-role') || checkbox.id.replace('role-', '');
            
            if (checkbox.checked) {
                selectedRoles.add(roleValue);
            } else {
                selectedRoles.delete(roleValue);
            }
            
            console.log('[DEBUG] PagePreview - Updated selected roles:', Array.from(selectedRoles));
            updatePageDropdown();
        }
        
        // Update the page dropdown based on role filters
        function updatePageDropdown() {
            console.log('[DEBUG] PagePreview - Updating page dropdown...');
            
            const dropdown = document.getElementById('pageDropdown');
            if (!dropdown) {
                console.error('[ERROR] PagePreview - Page dropdown element not found');
                return;
            }
            
            // Filter pages based on selected roles
            const filteredPages = allPages.filter(page => {
                if (!page.roleRequired) {
                    return selectedRoles.has('PUBLIC');
                }
                return selectedRoles.has(page.roleRequired);
            });
            
            console.log('[DEBUG] PagePreview - Filtered pages count:', filteredPages.length);
            console.log('[DEBUG] PagePreview - Filtered pages:', filteredPages);
            
            // Clear existing options (except the first one)
            dropdown.innerHTML = '<option value="">Select a page to preview...</option>';
            
            // Add filtered pages
            filteredPages.forEach((page, index) => {
                const option = document.createElement('option');
                option.value = index;
                // Display format: [name] - [title] (or just name if no title)
                const displayText = page.titleText && page.titleText !== page.name 
                    ? page.name + ' - ' + page.titleText
                    : page.name;
                option.textContent = displayText;
                option.setAttribute('data-name', page.name);
                option.setAttribute('data-object', page.objectName);
                dropdown.appendChild(option);
            });
            
            // Update the global filtered pages for selection handling
            window.filteredPages = filteredPages;
            
            // Hide preview if current selection is no longer valid
            if (currentSelectedPage && !filteredPages.some(p => p.name === currentSelectedPage.name)) {
                hidePreview();
            }
        }
        
        // Handle page selection from dropdown
        function handlePageSelection() {
            console.log('[DEBUG] PagePreview - Page selection changed');
            
            const dropdown = document.getElementById('pageDropdown');
            const selectedIndex = dropdown.value;
            
            if (!selectedIndex || selectedIndex === '') {
                console.log('[DEBUG] PagePreview - No page selected, hiding preview');
                hidePreview();
                return;
            }
            
            const selectedPage = window.filteredPages[parseInt(selectedIndex)];
            if (!selectedPage) {
                console.error('[ERROR] PagePreview - Selected page not found at index:', selectedIndex);
                hidePreview();
                return;
            }
            
            console.log('[DEBUG] PagePreview - Selected page:', selectedPage);
            currentSelectedPage = selectedPage;
            
            // Get the actual objectWorkflow or report object
            const actualPageObject = getPageObject(selectedPage.name);
            if (!actualPageObject) {
                console.error('[ERROR] PagePreview - Could not find actual page object for:', selectedPage.name);
                hidePreview();
                return;
            }
            
            console.log('[DEBUG] PagePreview - Found actual page object:', actualPageObject);
            
            if (actualPageObject.pageType === 'form') {
                showFormPreview(actualPageObject);
            } else if (actualPageObject.pageType === 'report') {
                showReportPreview(actualPageObject);
            } else {
                console.warn('[WARN] PagePreview - Unknown page type for:', selectedPage.name);
                hidePreview();
            }
        }
        
        // Show preview for a form
        function showFormPreview(page) {
            console.log('[DEBUG] PagePreview - Showing form preview for:', page.name);
            
            const previewSection = document.getElementById('previewSection');
            const previewContent = document.getElementById('previewContent');
            const viewDetailsSection = document.getElementById('viewDetailsSection');
            
            if (!previewSection || !previewContent) {
                console.error('[ERROR] PagePreview - Preview elements not found');
                return;
            }
            
            // Generate form preview HTML
            const formHTML = generateFormPreviewHTML(page);
            previewContent.innerHTML = formHTML;
            
            // Show the preview section
            previewSection.style.display = 'block';
            
            // Show the view details section
            if (viewDetailsSection) {
                viewDetailsSection.style.display = 'block';
            }
            
            // Scroll to preview section
            previewSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Show preview for a report (placeholder for future implementation)
        function showReportPreview(page) {
            console.log('[DEBUG] PagePreview - Showing report preview for:', page.name);
            
            const previewSection = document.getElementById('previewSection');
            const previewContent = document.getElementById('previewContent');
            const viewDetailsSection = document.getElementById('viewDetailsSection');
            
            if (!previewSection || !previewContent) {
                console.error('[ERROR] PagePreview - Preview elements not found');
                return;
            }
            
            // Show placeholder for report preview
            previewContent.innerHTML = generateReportPreviewHTML(page);
            
            // Show the preview section
            previewSection.style.display = 'block';
            
            // Show the view details section
            if (viewDetailsSection) {
                viewDetailsSection.style.display = 'block';
            }
            
            // Scroll to preview section
            previewSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Generate breadcrumb navigation HTML
        function generateBreadcrumbHTML(page) {
            console.log('[DEBUG] PagePreview - generateBreadcrumbHTML called for page:', page.name);
            
            // Get buttons from reportButton array only (breadcrumbs only exist there)
            const reportButtons = page.reportButton || [];
            
            if (reportButtons.length === 0) {
                console.log('[DEBUG] PagePreview - No report buttons found for page:', page.name);
                // No breadcrumbs if no report buttons exist
                return '';
            }
            
            console.log('[DEBUG] PagePreview - Page report buttons:', reportButtons);
            
            // Filter buttons to only include breadcrumb type buttons that should be shown
            const breadcrumbButtons = reportButtons.filter(button => 
                button.buttonType === "breadcrumb" && 
                button.isVisible !== "false" && 
                (button.isIgnored || "false") !== "true"
            );
            
            if (breadcrumbButtons.length === 0) {
                console.log('[DEBUG] PagePreview - No breadcrumb buttons found. All report buttons:', reportButtons.map(b => ({ type: b.buttonType, text: b.buttonText, visible: b.isVisible, ignored: b.isIgnored })));
                // No breadcrumbs if no breadcrumb buttons exist
                return '';
            }
            
            console.log('[DEBUG] PagePreview - Generating breadcrumb HTML, found buttons:', breadcrumbButtons.length);
            
            let html = '<div class="page-breadcrumb">';
            html += '<nav class="breadcrumb-nav" role="navigation" aria-label="Breadcrumb">';
            
            breadcrumbButtons.forEach((button, index) => {
                html += '<div class="breadcrumb-item">';
                
                // Add separator before each item except the first
                if (index > 0) {
                    html += '<span class="breadcrumb-separator" aria-hidden="true">›</span>';
                }
                
                const buttonText = button.buttonText || button.buttonName || 'Page';
                
                // Make breadcrumb clickable if it has destination
                if (button.destinationTargetName) {
                    const contextObjectName = button.destinationContextObjectName || '';
                    html += '<button class="breadcrumb-button" type="button" onclick="navigateToPage(\\'' + button.destinationTargetName + '\\', \\'' + contextObjectName + '\\')">';
                    html += buttonText;
                    html += '</button>';
                } else {
                    // Non-clickable breadcrumb (current page)
                    html += '<span class="breadcrumb-button" style="cursor: default; color: var(--vscode-foreground);">';
                    html += buttonText;
                    html += '</span>';
                }
                
                html += '</div>';
            });
            
            html += '</nav>';
            html += '</div>';
            
            return html;
        }
        
        // Generate back button HTML for reports
        function generateReportBackButton(page) {
            console.log('[DEBUG] PagePreview - generateReportBackButton called for page:', page.name);
            
            // Get buttons from reportButton array
            const reportButtons = page.reportButton || [];
            
            if (reportButtons.length === 0) {
                console.log('[DEBUG] PagePreview - No report buttons found for page:', page.name);
                return '';
            }
            
            console.log('[DEBUG] PagePreview - Page report buttons:', reportButtons);
            
            // Filter buttons to only include back type buttons that should be shown
            const backButtons = reportButtons.filter(button => 
                button.buttonType === "back" && 
                button.isVisible !== "false" && 
                (button.isIgnored || "false") !== "true"
            );
            
            if (backButtons.length === 0) {
                console.log('[DEBUG] PagePreview - No back buttons found. All report buttons:', reportButtons.map(b => ({ type: b.buttonType, text: b.buttonText, visible: b.isVisible, ignored: b.isIgnored })));
                return '';
            }
            
            console.log('[DEBUG] PagePreview - Generating back button HTML, found buttons:', backButtons.length);
            
            let html = '<div class="back-button-section">';
            
            backButtons.forEach((button) => {
                const buttonText = button.buttonText || button.buttonName || 'Back';
                
                // Make back button clickable if it has destination
                if (button.destinationTargetName) {
                    const contextObjectName = button.destinationContextObjectName || '';
                    html += '<button class="back-button" type="button" onclick="navigateToPage(\\'' + button.destinationTargetName + '\\', \\'' + contextObjectName + '\\')">';
                    html += '<span class="back-button-icon">←</span>';
                    html += buttonText;
                    html += '</button>';
                } else {
                    // Non-clickable back button
                    html += '<button class="back-button" type="button" disabled>';
                    html += '<span class="back-button-icon">←</span>';
                    html += buttonText;
                    html += '</button>';
                }
            });
            
            html += '</div>';
            
            return html;
        }
        
        // Generate HTML for form preview using actual objectWorkflow object
        function generateFormPreviewHTML(workflowObj) {
            console.log('[DEBUG] PagePreview - Generating form preview HTML for:', workflowObj.name);
            
            let html = '<div class="page-preview-container">';
            
            // Breadcrumb navigation (above page header) - use objectWorkflowButton for breadcrumbs
            if (workflowObj.objectWorkflowButton && workflowObj.objectWorkflowButton.length > 0) {
                html += generateBreadcrumbHTML({ buttons: workflowObj.objectWorkflowButton });
            }
            
            // Page header section (outside the form)
            html += '<div class="page-header">';
            if (workflowObj.titleText) {
                html += '<h1 class="page-title">' + workflowObj.titleText + '</h1>';
            }
            if (workflowObj.introText) {
                html += '<p class="page-intro">' + workflowObj.introText + '</p>';
            }
            html += '</div>';
            
            // Form container (the actual form)
            html += '<div class="form-preview">';
            
            // Form header section
            if (workflowObj.formTitleText || workflowObj.formIntroText) {
                html += '<div class="form-header">';
                if (workflowObj.formTitleText) {
                    html += '<h2 class="form-title">' + workflowObj.formTitleText + '</h2>';
                }
                if (workflowObj.formIntroText) {
                    html += '<p class="form-intro">' + workflowObj.formIntroText + '</p>';
                }
                html += '</div>';
            }
            
            // Form parameters section with actual fields - use objectWorkflowParam
            if (workflowObj.objectWorkflowParam && workflowObj.objectWorkflowParam.length > 0) {
                html += '<div class="form-section">';
                
                workflowObj.objectWorkflowParam.forEach(param => {
                    if ((param.isIgnored || "false") === "true" || param.isVisible !== "true") {
                        return; // Skip ignored or hidden parameters
                    }
                    
                    html += '<div class="form-field">';
                    
                    // Only show label for non-checkbox fields (checkboxes have their own label text)
                    if (!isCheckboxParameter(param)) {
                        // Field label
                        const labelText = param.labelText || param.name || 'Field';
                        const isRequired = param.isRequired === "true";
                        html += '<label class="form-field-label">' + labelText + (isRequired ? ' *' : '') + '</label>';
                    }
                    
                    // Generate input based on data type and properties
                    const inputHTML = generateFormInput(param);
                    html += inputHTML;
                    
                    // Field description
                    if (param.detailsText) {
                        html += '<div class="form-field-description">' + param.detailsText + '</div>';
                    }
                    
                    html += '</div>';
                });
                
                html += '</div>';
            } else {
                // Fallback to sample fields if no parameters defined
                html += '<div class="form-section">';
                
                html += '<div class="form-field">';
                html += '<label class="form-field-label">No Parameters Defined</label>';
                html += '<input type="text" class="form-field-input" placeholder="This form has no parameters configured" readonly>';
                html += '<div class="form-field-description">Configure parameters in the form details to see actual fields here</div>';
                html += '</div>';
                
                html += '</div>';
            }
            
            // Form buttons section - use objectWorkflowButton
            if (workflowObj.objectWorkflowButton && workflowObj.objectWorkflowButton.length > 0) {
                // Filter out breadcrumb buttons since they're displayed above the title
                const formButtons = workflowObj.objectWorkflowButton.filter(button => 
                    button.buttonType !== "breadcrumb"
                );
                
                if (formButtons.length > 0) {
                    html += '<div class="form-section">';
                    html += '<div class="form-buttons">';
                    
                    formButtons.forEach(button => {
                        // Only show buttons that are visible and not ignored
                        if ((button.isVisible || "true") !== "true" || (button.isIgnored || "false") === "true") {
                            return; // Skip hidden or ignored buttons
                        }
                        
                        // Use isButtonCallToAction to determine if button is primary
                        const buttonClass = button.isButtonCallToAction === "true" ? 'form-button primary' : 'form-button secondary';
                        const buttonText = button.buttonText || button.buttonName || 'Button';
                        
                        // Make button clickable if it has destination
                        if (button.destinationTargetName) {
                            const contextObjectName = button.destinationContextObjectName || '';
                            html += '<button class="' + buttonClass + '" type="button" onclick="handleFormButtonClick(\\'' + button.destinationTargetName + '\\', \\'' + contextObjectName + '\\')">';
                            html += buttonText;
                            html += '</button>';
                        } else {
                            html += '<button class="' + buttonClass + '" type="button" disabled>';
                            html += buttonText;
                            html += '</button>';
                        }
                    });
                    
                    html += '</div>';
                    html += '</div>';
                }
            } else {
                // Default buttons if none are defined
                html += '<div class="form-section">';
                html += '<div class="form-buttons">';
                html += '<button class="form-button secondary" type="button" disabled>Cancel</button>';
                html += '<button class="form-button primary" type="button" disabled>Save</button>';
                html += '</div>';
                html += '</div>';
            }
            
            html += '</div>'; // End form-preview
            html += '</div>'; // End page-preview-container
            
            return html;
        }
        
        // Helper function to determine if a parameter will be rendered as a checkbox
        function isCheckboxParameter(param) {
            const dataType = (param.sqlServerDBDataType || '').toLowerCase();
            return dataType.includes('bit') || dataType.includes('boolean');
        }
        
        // Generate form input based on parameter properties
        function generateFormInput(param) {
            let html = '';
            const isRequired = param.isRequired === "true";
            
            // Determine input type based on SQL Server data type and other properties
            const dataType = (param.sqlServerDBDataType || '').toLowerCase();
            
            if (param.isFKLookup === "true" || param.isFKList === "true") {
                // Foreign key lookup - dropdown
                html += '<select class="form-field-input"' + (isRequired ? ' required' : '') + '>';
                html += '<option value="">Select ' + (param.labelText || param.name || 'option') + '...</option>';
                html += '<option value="sample1">Sample Option 1</option>';
                html += '<option value="sample2">Sample Option 2</option>';
                html += '</select>';
            } else if (dataType.includes('text') || dataType.includes('ntext') || 
                      param.inputControl === 'textarea' || 
                      (param.sqlServerDBDataTypeSize && parseInt(param.sqlServerDBDataTypeSize) > 255)) {
                // Large text - textarea
                html += '<textarea class="form-field-input form-field-textarea"' +
                        (isRequired ? ' required' : '') + '></textarea>';
            } else if (dataType.includes('bit') || dataType.includes('boolean')) {
                // Boolean - checkbox
                html += '<div class="checkbox-container">';
                html += '<input type="checkbox" class="form-field-checkbox">';
                const labelText = param.labelText || param.name || 'Yes/No';
                const isRequired = param.isRequired === "true";
                html += '<span class="checkbox-label">' + labelText + (isRequired ? ' *' : '') + '</span>';
                html += '</div>';
            } else if (dataType.includes('int') || dataType.includes('decimal') || 
                      dataType.includes('float') || dataType.includes('money') || dataType.includes('numeric')) {
                // Numeric input
                html += '<input type="number" class="form-field-input"' +
                        (isRequired ? ' required' : '') + '>';
            } else if (dataType.includes('date') || dataType.includes('time')) {
                // Date/time input
                const inputType = dataType.includes('time') && !dataType.includes('date') ? 'time' : 
                                 dataType.includes('datetime') ? 'datetime-local' : 'date';
                html += '<input type="' + inputType + '" class="form-field-input"' +
                        (isRequired ? ' required' : '') + '>';
            } else if (param.isSecured === "true" || param.name && param.name.toLowerCase().includes('password')) {
                // Password input
                html += '<input type="password" class="form-field-input"' +
                        (isRequired ? ' required' : '') + '>';
            } else {
                // Default - text input
                html += '<input type="text" class="form-field-input"' +
                        (isRequired ? ' required' : '') + '>';
            }
            
            return html;
        }
        
        // Generate HTML for report preview
        function generateReportPreviewHTML(page) {
            console.log('[DEBUG] PagePreview - Generating report preview HTML for:', page.name);
            
            let html = '<div class="page-preview-container">';
            
            // Breadcrumb navigation (above page header) - only show if not hidden
            if (page.isBreadcrumbSectionHidden !== "true") {
                html += generateBreadcrumbHTML(page);
            }
            
            // Page header section (outside the report)
            html += '<div class="page-header">';
            if (page.titleText) {
                html += '<h1 class="page-title">' + page.titleText + '</h1>';
            }
            if (page.introText) {
                html += '<p class="page-intro">' + page.introText + '</p>';
            }
            html += '</div>';
            
            // Back button (after title and intro, before report content)
            html += generateReportBackButton(page);
            
            // Report container (the actual report)
            html += '<div class="form-preview">';
            
            // Report action buttons (add and other types) - above filters
            html += generateReportActionButtons(page);
            
            // Report filters section (if reportParam exists and not hidden)
            if (page.reportParam && page.reportParam.length > 0 && page.isFilterSectionHidden !== "true") {
                html += generateReportFilters(page.reportParam);
            }
            
            // Generate report based on visualization type
            if (page.visualizationType === 'Grid' || !page.visualizationType) {
                html += generateReportGrid(page);
            } else if (page.visualizationType === 'DetailTwoColumn') {
                html += generateReportDetailTwoColumn(page);
            } else if (page.visualizationType === 'DetailThreeColumn') {
                html += generateReportDetailThreeColumn(page);
            } else {
                // Placeholder for other visualization types
                html += '<div class="empty-state">';
                html += '<p>Visualization type "' + page.visualizationType + '" preview will be implemented in a future update.</p>';
                html += '<p>Currently supported: <strong>Grid, DetailTwoColumn, DetailThreeColumn</strong></p>';
                html += '</div>';
            }
            
            html += '</div>'; // End form-preview (report container)
            html += '</div>'; // End page-preview-container
            
            return html;
        }
        
        // Generate report action buttons (add, other types) above filters section
        function generateReportActionButtons(page) {
            console.log('[DEBUG] PagePreview - generateReportActionButtons called for page:', page.name);
            
            // Get buttons from reportButton array
            const reportButtons = page.reportButton || [];
            
            if (reportButtons.length === 0) {
                console.log('[DEBUG] PagePreview - No report buttons found for page:', page.name);
                return '';
            }
            
            console.log('[DEBUG] PagePreview - Page report buttons:', reportButtons);
            
            // Filter buttons to only include action type buttons (excluding breadcrumb and back)
            const actionButtons = reportButtons.filter(button => 
                button.buttonType !== "breadcrumb" && 
                button.buttonType !== "back" && 
                button.isVisible !== "false" && 
                (button.isIgnored || "false") !== "true"
            );
            
            if (actionButtons.length === 0) {
                console.log('[DEBUG] PagePreview - No action buttons found. All report buttons:', reportButtons.map(b => ({ type: b.buttonType, text: b.buttonText, visible: b.isVisible, ignored: b.isIgnored })));
                return '';
            }
            
            console.log('[DEBUG] PagePreview - Generating action buttons HTML, found buttons:', actionButtons.length);
            
            let html = '<div class="report-action-buttons">';
            
            actionButtons.forEach((button) => {
                const buttonText = button.buttonText || button.buttonName || 'Action';
                const buttonType = button.buttonType || 'button';
                
                // Determine button style based on type
                let buttonClass = 'report-action-btn';
                if (buttonType === 'add') {
                    buttonClass += ' add-button';
                } else {
                    buttonClass += ' action-button';
                }
                
                // Make button clickable if it has destination
                if (button.destinationTargetName) {
                    const contextObjectName = button.destinationContextObjectName || '';
                    html += '<button class="' + buttonClass + '" type="button" onclick="handleReportActionClick(\\'' + button.destinationTargetName + '\\', \\'' + contextObjectName + '\\', \\'' + buttonType + '\\')">';
                    
                    // Add appropriate icon for button type
                    if (buttonType === 'add') {
                        html += '<span class="action-button-icon">+</span>';
                    } else if (buttonType === 'edit') {
                        html += '<span class="action-button-icon">✎</span>';
                    } else if (buttonType === 'delete') {
                        html += '<span class="action-button-icon">×</span>';
                    } else if (buttonType === 'refresh' || buttonType === 'reload') {
                        html += '<span class="action-button-icon">↻</span>';
                    } else if (buttonType === 'export') {
                        html += '<span class="action-button-icon">📊</span>';
                    } else {
                        html += '<span class="action-button-icon">▶</span>';
                    }
                    
                    html += buttonText;
                    html += '</button>';
                } else {
                    // Non-clickable button
                    html += '<button class="' + buttonClass + '" type="button" disabled>';
                    
                    // Add appropriate icon for button type
                    if (buttonType === 'add') {
                        html += '<span class="action-button-icon">+</span>';
                    } else {
                        html += '<span class="action-button-icon">▶</span>';
                    }
                    
                    html += buttonText;
                    html += '</button>';
                }
            });
            
            html += '</div>';
            
            return html;
        }
        
        // Generate report filters section
        function generateReportFilters(reportParams) {
            // Filter visible and non-ignored report parameters
            const visibleParams = reportParams.filter(param => 
                (param.isIgnored || "false") !== "true" && param.isVisible === "true"
            );
            
            // Don't show filters section if no visible parameters
            if (visibleParams.length === 0) {
                return '';
            }
            
            let html = '<div class="report-filters">';
            html += '<div class="filter-header">';
            html += '<h4 class="filter-title" onclick="toggleFilters()">Report Filters</h4>';
            html += '<button class="filter-collapse-button" onclick="toggleFilters()" title="Collapse/Expand Filters">▼</button>';
            html += '</div>';
            
            html += '<div class="filter-content" id="filterContent">';
            
            // Group parameters in rows of 3
            for (let i = 0; i < visibleParams.length; i += 3) {
                html += '<div class="filter-row">';
                
                for (let j = i; j < Math.min(i + 3, visibleParams.length); j++) {
                    const param = visibleParams[j];
                    html += '<div class="filter-field">';
                    html += '<label class="filter-label">' + (param.labelText || param.name || 'Filter') + '</label>';
                    
                    // Generate filter input based on data type
                    const filterInput = generateFilterInput(param);
                    html += filterInput;
                    
                    html += '</div>';
                }
                
                html += '</div>';
            }
            
            // Filter action buttons at bottom right
            html += '<div class="filter-actions">';
            html += '<button class="filter-action-button secondary" onclick="clearFilters()" type="button">Clear</button>';
            html += '<button class="filter-action-button primary" onclick="searchFilters()" type="button">Search</button>';
            html += '</div>';
            
            html += '</div>'; // End filter-content
            html += '</div>'; // End report-filters
            return html;
        }
        
        // Generate filter input based on parameter properties
        function generateFilterInput(param) {
            const dataType = (param.sqlServerDBDataType || '').toLowerCase();
            
            if (param.isFKLookup === "true" || param.isFKList === "true") {
                // Foreign key lookup - dropdown
                let html = '<select class="filter-input">';
                html += '<option value="">All</option>';
                html += '<option value="sample1">Sample Option 1</option>';
                html += '<option value="sample2">Sample Option 2</option>';
                html += '</select>';
                return html;
            } else if (dataType.includes('bit') || dataType.includes('boolean')) {
                // Boolean - select
                let html = '<select class="filter-input">';
                html += '<option value="">All</option>';
                html += '<option value="true">Yes</option>';
                html += '<option value="false">No</option>';
                html += '</select>';
                return html;
            } else if (dataType.includes('date')) {
                // Date input
                return '<input type="date" class="filter-input">';
            } else if (dataType.includes('int') || dataType.includes('decimal') || 
                      dataType.includes('float') || dataType.includes('money') || dataType.includes('numeric')) {
                // Numeric input
                return '<input type="number" class="filter-input" placeholder="Enter value...">';
            } else {
                // Default - text input
                return '<input type="text" class="filter-input" placeholder="Search...">';
            }
        }
        
        // Generate report grid
        function generateReportGrid(page) {
            // Determine columns based on parameters or use default columns
            const columns = getReportColumns(page);
            const sampleData = generateSampleReportData(columns, page.objectName);
            
            if (columns.length === 0) {
                return '<div class="report-grid-container"><div class="report-grid-empty">No columns configured for this report</div></div>';
            }
            
            if (sampleData.length === 0) {
                return '<div class="report-grid-container"><div class="report-grid-empty">No data available</div></div>';
            }
            
            let html = '<div class="report-grid-container">';
            html += '<table class="report-grid" id="reportGrid">';
            
            // Table header
            html += '<thead>';
            html += '<tr>';
            
            // Data columns
            columns.forEach((column, index) => {
                html += '<th class="sortable" data-column="' + index + '" onclick="sortReportGrid(' + index + ')">';
                html += column.displayName || '&nbsp;'; // Use non-breaking space if no display name
                html += '</th>';
            });
            html += '</tr>';
            html += '</thead>';
            
            // Table body
            html += '<tbody>';
            sampleData.forEach((row, rowIndex) => {
                html += '<tr>';
                
                // Data cells
                columns.forEach(column => {
                    if (column.isButton === "true") {
                        // Generate button cell
                        const buttonText = column.buttonText || (column.displayName && column.displayName.trim()) || 'Action';
                        const destinationTargetName = column.destinationTargetName || '';
                        const isAsyncWorkflow = column.isButtonAsyncObjWF === "true";
                        
                        html += '<td class="button-cell">';
                        if (destinationTargetName && !isAsyncWorkflow) {
                            // Clickable button that changes selected page
                            const contextObjectName = column.destinationContextObjectName || '';
                            html += '<button class="grid-action-btn" type="button" onclick="handleGridButtonClick(\\'' + destinationTargetName + '\\', \\'' + contextObjectName + '\\')">';
                            html += buttonText;
                            html += '</button>';
                        } else if (destinationTargetName && isAsyncWorkflow) {
                            // Non-navigating button (async workflow)
                            html += '<button class="grid-action-btn async-btn" type="button" onclick="handleAsyncGridButton(\\'' + destinationTargetName + '\\')">';
                            html += buttonText;
                            html += '</button>';
                        } else {
                            // Disabled button with no destination
                            html += '<button class="grid-action-btn" type="button" disabled>';
                            html += buttonText;
                            html += '</button>';
                        }
                        html += '</td>';
                    } else {
                        // Generate regular data cell
                        const value = row[column.name] || '';
                        const dataType = (column.dataType || '').toLowerCase();
                        
                        // Handle bit/boolean columns specially
                        if (dataType.includes('bit') || dataType.includes('boolean')) {
                            const isChecked = value === 'Yes' || value === true || value === 'true' || value === 1 || value === '1';
                            const titleValue = isChecked ? 'Yes' : 'No';
                            const checkboxHTML = '<input type="checkbox" class="data-checkbox" ' + (isChecked ? 'checked' : '') + ' disabled>';
                            html += '<td title="' + titleValue + '">' + checkboxHTML + '</td>';
                        } else {
                            const formattedValue = formatCellValue(value, column.dataType);
                            html += '<td title="' + formattedValue + '">' + formattedValue + '</td>';
                        }
                    }
                });
                html += '</tr>';
            });
            html += '</tbody>';
            
            html += '</table>';
            
            // Grid footer with pagination controls (only show if paging is available)
            if (page.isPagingAvailable !== "false") {
                html += '<div class="report-grid-footer">';
                
                // Left side - Items per page dropdown
                html += '<div class="pagination-left">';
                html += '<label for="itemsPerPage" class="pagination-label">Items per page:</label>';
                html += '<select id="itemsPerPage" class="pagination-select" onchange="changeItemsPerPage()">';
                html += '<option value="10" selected>10</option>';
                html += '<option value="25">25</option>';
                html += '<option value="50">50</option>';
                html += '<option value="100">100</option>';
                html += '</select>';
                html += '</div>';
                
                // Center - Pagination controls
                html += '<div class="pagination-center">';
                html += '<button class="pagination-btn" onclick="goToFirstPage()" title="First Page">⟪</button>';
                html += '<button class="pagination-btn" onclick="goToPreviousPage()" title="Previous Page">❮</button>';
                html += '<span class="pagination-info">Page 1 of 1</span>';
                html += '<button class="pagination-btn" onclick="goToNextPage()" title="Next Page">❯</button>';
                html += '<button class="pagination-btn" onclick="goToLastPage()" title="Last Page">⟫</button>';
                html += '</div>';
                
                // Right side - Row count indicator
                html += '<div class="pagination-right">';
                const totalRows = Math.floor(Math.random() * 200) + 150; // Simulate total available rows (150-349)
                const startRow = 1;
                const endRow = Math.min(sampleData.length, 10); // Currently showing up to 10 items
                html += '<span class="row-count-info">Showing ' + startRow + ' - ' + endRow + ' of ' + totalRows + ' rows</span>';
                html += '</div>';
                
                html += '</div>'; // End report-grid-footer
            }
            
            // Export buttons section (only show if export buttons are not hidden)
            if (page.isExportButtonsHidden !== "true") {
                html += '<div class="report-export-section">';
                html += '<button class="export-button" onclick="exportToCSV()" title="Export to CSV">';
                html += '<span class="export-icon">📊</span>';
                html += '<span class="export-text">Export to CSV</span>';
                html += '</button>';
                html += '</div>';
            }
            
            html += '</div>'; // End report-grid-container
            
            return html;
        }
        
        // Generate report detail two-column view
        function generateReportDetailTwoColumn(page) {
            // Determine columns based on parameters or use default columns
            const columns = getReportColumns(page);
            const sampleData = generateSampleReportData(columns, page.objectName);
            
            if (columns.length === 0) {
                return '<div class="report-grid-container"><div class="report-grid-empty">No columns configured for this report</div></div>';
            }
            
            if (sampleData.length === 0) {
                return '<div class="report-grid-container"><div class="report-grid-empty">No data available</div></div>';
            }
            
            // Use the first row of sample data for the detail view
            const detailRow = sampleData[0];
            
            let html = '<div class="report-detail-container">';
            html += '<table class="report-detail-table" id="reportDetailTable">';
            
            // Table body with two columns: Header Text | Value
            html += '<tbody>';
            
            columns.forEach(column => {
                const headerText = column.headerText || '';
                
                html += '<tr>';
                
                // First column: Header text
                html += '<td class="detail-header">';
                html += headerText || '&nbsp;';
                html += '</td>';
                
                // Second column: Value or Button
                html += '<td class="detail-value">';
                
                if (column.isButton === "true") {
                    // Generate button in detail value cell
                    const buttonText = column.buttonText || (column.headerText && column.headerText.trim()) || 'Action';
                    const destinationTargetName = column.destinationTargetName || '';
                    const isAsyncWorkflow = column.isButtonAsyncObjWF === "true";
                    
                    if (destinationTargetName && !isAsyncWorkflow) {
                        // Clickable button that changes selected page
                        const contextObjectName = column.destinationContextObjectName || '';
                        html += '<button class="grid-action-btn" type="button" onclick="handleGridButtonClick(\\'' + destinationTargetName + '\\', \\'' + contextObjectName + '\\')">';
                        html += buttonText;
                        html += '</button>';
                    } else if (destinationTargetName && isAsyncWorkflow) {
                        // Non-navigating button (async workflow)
                        html += '<button class="grid-action-btn async-btn" type="button" onclick="handleAsyncGridButton(\\'' + destinationTargetName + '\\')">';
                        html += buttonText;
                        html += '</button>';
                    } else {
                        // Disabled button with no destination
                        html += '<button class="grid-action-btn" type="button" disabled>';
                        html += buttonText;
                        html += '</button>';
                    }
                } else {
                    // Regular data value
                    const value = detailRow[column.name] || '';
                    const dataType = (column.dataType || '').toLowerCase();
                    
                    // Handle bit/boolean columns specially  
                    if (dataType.includes('bit') || dataType.includes('boolean')) {
                        const isChecked = value === 'Yes' || value === true || value === 'true' || value === 1 || value === '1';
                        const checkboxHTML = '<input type="checkbox" class="data-checkbox" ' + (isChecked ? 'checked' : '') + ' disabled>';
                        html += checkboxHTML;
                    } else {
                        const formattedValue = formatCellValue(value, column.dataType);
                        html += formattedValue;
                    }
                }
                
                html += '</td>';
                html += '</tr>';
            });
            
            html += '</tbody>';
            html += '</table>';
            html += '</div>'; // End report-detail-container
            
            return html;
        }
        
        // Generate report detail three-column view (data in two columns, buttons in separate table)
        function generateReportDetailThreeColumn(page) {
            // Determine columns based on parameters or use default columns
            const columns = getReportColumns(page);
            const sampleData = generateSampleReportData(columns, page.objectName);
            
            if (columns.length === 0) {
                return '<div class="report-grid-container"><div class="report-grid-empty">No columns configured for this report</div></div>';
            }
            
            if (sampleData.length === 0) {
                return '<div class="report-grid-container"><div class="report-grid-empty">No data available</div></div>';
            }
            
            // Separate data columns from button columns
            const dataColumns = columns.filter(column => column.isButton !== "true");
            const buttonColumns = columns.filter(column => column.isButton === "true");
            
            // Use the first row of sample data for the detail view
            const detailRow = sampleData[0];
            
            let html = '<div class="report-detail-three-container">';
            
            // First table: Two-column data table (header + value)
            if (dataColumns.length > 0) {
                html += '<div class="detail-data-section">';
                html += '<table class="report-detail-table" id="reportDetailDataTable">';
                html += '<tbody>';
                
                dataColumns.forEach(column => {
                    const headerText = column.headerText || '';
                    const value = detailRow[column.name] || '';
                    
                    html += '<tr>';
                    
                    // First column: Header text
                    html += '<td class="detail-header">';
                    html += headerText || '&nbsp;';
                    html += '</td>';
                    
                    // Second column: Value
                    html += '<td class="detail-value">';
                    const dataType = (column.dataType || '').toLowerCase();
                    
                    // Handle bit/boolean columns specially  
                    if (dataType.includes('bit') || dataType.includes('boolean')) {
                        const isChecked = value === 'Yes' || value === true || value === 'true' || value === 1 || value === '1';
                        const checkboxHTML = '<input type="checkbox" class="data-checkbox" ' + (isChecked ? 'checked' : '') + ' disabled>';
                        html += checkboxHTML;
                    } else {
                        const formattedValue = formatCellValue(value, column.dataType);
                        html += formattedValue;
                    }
                    
                    html += '</td>';
                    html += '</tr>';
                });
                
                html += '</tbody>';
                html += '</table>';
                html += '</div>'; // End detail-data-section
            }
            
            // Second table: Button columns in single-column actions table
            if (buttonColumns.length > 0) {
                html += '<div class="detail-buttons-section">';
                html += '<table class="report-detail-buttons-table" id="reportDetailButtonsTable">';
                html += '<tbody>';
                
                buttonColumns.forEach(column => {
                    const buttonText = column.buttonText || (column.headerText && column.headerText.trim()) || 'Action';
                    const destinationTargetName = column.destinationTargetName || '';
                    const isAsyncWorkflow = column.isButtonAsyncObjWF === "true";
                    
                    html += '<tr>';
                    
                    // Single column: Button only
                    html += '<td class="detail-button-single">';
                    
                    if (destinationTargetName && !isAsyncWorkflow) {
                        // Clickable button that changes selected page
                        const contextObjectName = column.destinationContextObjectName || '';
                        html += '<button class="grid-action-btn" type="button" onclick="handleGridButtonClick(\\'' + destinationTargetName + '\\', \\'' + contextObjectName + '\\')">';
                        html += buttonText;
                        html += '</button>';
                    } else if (destinationTargetName && isAsyncWorkflow) {
                        // Non-navigating button (async workflow)
                        html += '<button class="grid-action-btn async-btn" type="button" onclick="handleAsyncGridButton(\\'' + destinationTargetName + '\\')">';
                        html += buttonText;
                        html += '</button>';
                    } else {
                        // Disabled button with no destination
                        html += '<button class="grid-action-btn" type="button" disabled>';
                        html += buttonText;
                        html += '</button>';
                    }
                    
                    html += '</td>';
                    html += '</tr>';
                });
                
                html += '</tbody>';
                html += '</table>';
                html += '</div>'; // End detail-buttons-section
            }
            
            html += '</div>'; // End report-detail-three-container
            
            return html;
        }
        
        // Get report columns based on page reportColumn array
        function getReportColumns(page) {
            const columns = [];
            
            // Use reportColumn array if available
            if (page.reportColumn && page.reportColumn.length > 0) {
                page.reportColumn.forEach(column => {
                    // Only include visible and non-ignored columns
                    if ((column.isIgnored || "false") !== "true" && column.isVisible !== "false") {
                        const columnObj = {
                            name: column.name || 'field',
                            displayName: column.headerText || '',
                            headerText: column.headerText || '',
                            dataType: column.sqlServerDBDataType || 'varchar'
                        };
                        
                        // Add button properties if this column is a button
                        if (column.isButton === "true") {
                            columnObj.isButton = column.isButton;
                            columnObj.buttonText = column.buttonText;
                            columnObj.destinationTargetName = column.destinationTargetName;
                            columnObj.destinationContextObjectName = column.destinationContextObjectName;
                            columnObj.isButtonAsyncObjWF = column.isButtonAsyncObjWF;
                        }
                        
                        columns.push(columnObj);
                    }
                });
            }
            
            // If no reportColumn array or no visible columns, use default columns based on object name
            if (columns.length === 0) {
                const objectName = page.objectName || 'Object';
                columns.push(
                    { name: 'id', displayName: 'ID', dataType: 'int' },
                    { name: 'name', displayName: 'Name', dataType: 'varchar' },
                    { name: 'description', displayName: 'Description', dataType: 'varchar' },
                    { name: 'createdDate', displayName: 'Created Date', dataType: 'datetime' },
                    { name: 'isActive', displayName: 'Active', dataType: 'bit' }
                );
            }
            
            return columns;
        }
        
        // Generate sample data for report
        function generateSampleReportData(columns, objectName) {
            const sampleData = [];
            const rowCount = 8; // Show 8 sample rows
            
            for (let i = 1; i <= rowCount; i++) {
                const row = {};
                
                columns.forEach(column => {
                    row[column.name] = generateSampleCellValue(column, i, objectName);
                });
                
                sampleData.push(row);
            }
            
            return sampleData;
        }
        
        // Generate sample cell value based on column type
        function generateSampleCellValue(column, rowIndex, objectName) {
            const dataType = (column.dataType || '').toLowerCase();
            const columnName = (column.name || '').toLowerCase();
            
            // ID columns
            if (columnName.includes('id') || dataType.includes('int')) {
                if (columnName === 'id') return rowIndex;
                return Math.floor(Math.random() * 1000) + 1;
            }
            
            // Date columns
            if (dataType.includes('date') || dataType.includes('time') || columnName.includes('date') || columnName.includes('created') || columnName.includes('modified')) {
                const baseDate = new Date(2024, 0, 1);
                const randomDays = Math.floor(Math.random() * 365);
                const sampleDate = new Date(baseDate.getTime() + randomDays * 24 * 60 * 60 * 1000);
                
                if (dataType.includes('datetime')) {
                    return sampleDate.toLocaleString();
                } else {
                    return sampleDate.toLocaleDateString();
                }
            }
            
            // Boolean columns
            if (dataType.includes('bit') || dataType.includes('boolean') || columnName.includes('active') || columnName.includes('enabled')) {
                return Math.random() > 0.3 ? 'Yes' : 'No';
            }
            
            // Money/decimal columns
            if (dataType.includes('money') || dataType.includes('decimal') || dataType.includes('float') || 
                columnName.includes('price') || columnName.includes('amount') || columnName.includes('cost')) {
                return '$' + (Math.random() * 10000).toFixed(2);
            }
            
            // Numeric columns
            if (dataType.includes('int') || dataType.includes('numeric')) {
                return Math.floor(Math.random() * 1000) + 1;
            }
            
            // Text columns - generate contextual sample data
            if (columnName.includes('name') || columnName.includes('title')) {
                const sampleNames = [
                    objectName + ' Item ' + rowIndex,
                    'Sample ' + objectName + ' ' + rowIndex,
                    objectName + ' Entry #' + rowIndex,
                    'Test ' + objectName + ' ' + String.fromCharCode(64 + rowIndex)
                ];
                return sampleNames[rowIndex % sampleNames.length];
            }
            
            if (columnName.includes('description') || columnName.includes('note') || columnName.includes('comment')) {
                const descriptions = [
                    'This is a sample description for item ' + rowIndex,
                    'Example content showing how this field would appear',
                    'Sample data demonstrating the report layout and formatting',
                    'Placeholder text for ' + (column.displayName ? column.displayName.toLowerCase() : 'column')
                ];
                return descriptions[rowIndex % descriptions.length];
            }
            
            if (columnName.includes('email')) {
                return 'user' + rowIndex + '@example.com';
            }
            
            if (columnName.includes('phone')) {
                return '(555) ' + String(Math.floor(Math.random() * 900) + 100) + '-' + String(Math.floor(Math.random() * 9000) + 1000);
            }
            
            if (columnName.includes('status') || columnName.includes('state')) {
                const statuses = ['Active', 'Inactive', 'Pending', 'Completed', 'Draft'];
                return statuses[rowIndex % statuses.length];
            }
            
            // Default text value
            return 'Sample ' + (column.displayName || 'Data') + ' ' + rowIndex;
        }
        
        // Format cell value for display
        function formatCellValue(value, dataType) {
            if (!value) return '';
            
            const dataTypeLower = (dataType || '').toLowerCase();
            
            // Format dates
            if (dataTypeLower.includes('date') || dataTypeLower.includes('time')) {
                if (typeof value === 'string' && value.includes('/')) {
                    return value; // Already formatted
                }
                return new Date(value).toLocaleDateString();
            }
            
            // Format money
            if (dataTypeLower.includes('money') && !value.toString().includes('$')) {
                return '$' + parseFloat(value).toFixed(2);
            }
            
            // Format large numbers
            if (dataTypeLower.includes('int') && parseInt(value) > 9999) {
                return parseInt(value).toLocaleString();
            }
            
            return value.toString();
        }
        
        // Hide the preview section
        function hidePreview() {
            console.log('[DEBUG] PagePreview - Hiding preview');
            
            const previewSection = document.getElementById('previewSection');
            const viewDetailsSection = document.getElementById('viewDetailsSection');
            
            if (previewSection) {
                previewSection.style.display = 'none';
            }
            
            if (viewDetailsSection) {
                viewDetailsSection.style.display = 'none';
            }
            
            currentSelectedPage = null;
        }
        
        // Handle form button click to navigate to destination
        function handleFormButtonClick(destinationTargetName, destinationContextObjectName) {
            console.log('[DEBUG] PagePreview - Form button clicked:', destinationTargetName, destinationContextObjectName);
            
            // Find the destination page in our filtered pages
            const destinationPage = window.filteredPages.find(page => 
                page.name === destinationTargetName && 
                (!destinationContextObjectName || page.objectName === destinationContextObjectName)
            );
            
            if (destinationPage) {
                // Update the dropdown selection to the destination page
                const dropdown = document.getElementById('pageDropdown');
                if (dropdown) {
                    const destinationIndex = window.filteredPages.indexOf(destinationPage);
                    if (destinationIndex >= 0) {
                        dropdown.value = destinationIndex;
                        // Trigger the selection change event
                        handlePageSelection();
                        
                        // Scroll to the preview section
                        const previewSection = document.getElementById('previewSection');
                        if (previewSection) {
                            previewSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }
            } else {
                console.log('[DEBUG] PagePreview - Destination page not found or not visible with current role filters:', destinationTargetName);
                // Show a message to the user
                alert('Destination page "' + destinationTargetName + '" is not available with the current role filters.');
            }
        }
        
        // Handle report action button click to navigate to destination
        function handleReportActionClick(destinationTargetName, destinationContextObjectName, buttonType) {
            console.log('[DEBUG] PagePreview - Report action button clicked:', destinationTargetName, destinationContextObjectName, buttonType);
            
            // Find the destination page in our filtered pages
            const destinationPage = window.filteredPages.find(page => 
                page.name === destinationTargetName && 
                (!destinationContextObjectName || page.objectName === destinationContextObjectName)
            );
            
            if (destinationPage) {
                // Update the dropdown selection to the destination page
                const dropdown = document.getElementById('pageDropdown');
                if (dropdown) {
                    const destinationIndex = window.filteredPages.indexOf(destinationPage);
                    if (destinationIndex >= 0) {
                        dropdown.value = destinationIndex;
                        // Trigger the selection change event
                        handlePageSelection();
                        
                        // Scroll to the preview section
                        const previewSection = document.getElementById('previewSection');
                        if (previewSection) {
                            previewSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }
            } else {
                console.log('[DEBUG] PagePreview - Destination page not found or not visible with current role filters:', destinationTargetName);
                // Show a message to the user based on button type
                let actionName = 'Action';
                if (buttonType === 'add') {
                    actionName = 'Add';
                } else if (buttonType === 'edit') {
                    actionName = 'Edit';
                } else if (buttonType === 'delete') {
                    actionName = 'Delete';
                } else if (buttonType === 'export') {
                    actionName = 'Export';
                }
                alert(actionName + ' action destination page "' + destinationTargetName + '" is not available with the current role filters.');
            }
        }
        
        // Handle grid button click to navigate to destination (non-async workflows only)
        function handleGridButtonClick(destinationTargetName, destinationContextObjectName) {
            console.log('[DEBUG] PagePreview - Grid button clicked:', destinationTargetName, destinationContextObjectName);
            
            // Find the destination page in our filtered pages
            const destinationPage = window.filteredPages.find(page => 
                page.name === destinationTargetName && 
                (!destinationContextObjectName || page.objectName === destinationContextObjectName)
            );
            
            if (destinationPage) {
                // Update the dropdown selection to the destination page
                const dropdown = document.getElementById('pageDropdown');
                if (dropdown) {
                    const destinationIndex = window.filteredPages.indexOf(destinationPage);
                    if (destinationIndex >= 0) {
                        dropdown.value = destinationIndex;
                        // Trigger the selection change event
                        handlePageSelection();
                        
                        // Scroll to the preview section
                        const previewSection = document.getElementById('previewSection');
                        if (previewSection) {
                            previewSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                }
            } else {
                console.log('[DEBUG] PagePreview - Grid button destination page not found or not visible with current role filters:', destinationTargetName);
                alert('Grid button destination page "' + destinationTargetName + '" is not available with the current role filters.');
            }
        }
        
        // Handle async grid button click (no page navigation)
        function handleAsyncGridButton(destinationTargetName) {
            console.log('[DEBUG] PagePreview - Async grid button clicked:', destinationTargetName);
            
            // For async workflow buttons, we don't change the page selection
            // In a real implementation, this would trigger an async workflow
            alert('Async workflow "' + destinationTargetName + '" would be triggered. No page navigation occurs for async workflows.');
        }
        
        // Handle breadcrumb navigation to change page dropdown
        function navigateToPage(destinationTargetName, destinationContextObjectName) {
            console.log('[DEBUG] PagePreview - Breadcrumb clicked, navigating to:', destinationTargetName, destinationContextObjectName);
            
            // Find the destination page in our filtered pages
            const destinationPage = window.filteredPages.find(page => 
                page.name === destinationTargetName && 
                (!destinationContextObjectName || page.objectName === destinationContextObjectName)
            );
            
            if (destinationPage) {
                // Update the dropdown selection to the destination page
                const dropdown = document.getElementById('pageDropdown');
                if (dropdown) {
                    const destinationIndex = window.filteredPages.indexOf(destinationPage);
                    if (destinationIndex >= 0) {
                        console.log('[DEBUG] PagePreview - Setting dropdown to index:', destinationIndex, 'for page:', destinationPage.name);
                        dropdown.value = destinationIndex;
                        // Trigger the selection change event
                        handlePageSelection();
                        
                        // Scroll to the preview section smoothly
                        const previewSection = document.getElementById('previewSection');
                        if (previewSection) {
                            previewSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    } else {
                        console.error('[ERROR] PagePreview - Could not find destination page index');
                    }
                } else {
                    console.error('[ERROR] PagePreview - Page dropdown element not found');
                }
            } else {
                console.log('[DEBUG] PagePreview - Destination page not found or not visible with current role filters:', destinationTargetName);
                // Show a message to the user
                alert('Destination page "' + destinationTargetName + '" is not available with the current role filters.');
            }
        }
        
        // Handle view details button click
        function handleViewDetails() {
            console.log('[DEBUG] PagePreview - Handle view details clicked');
            
            if (!currentSelectedPage) {
                console.error('[ERROR] PagePreview - No page selected');
                return;
            }
            
            // Determine page type dynamically
            const pageType = determinePageType(currentSelectedPage.name);
            
            if (pageType === 'form') {
                viewFormDetails(currentSelectedPage.name, currentSelectedPage.objectName);
            } else if (pageType === 'report') {
                viewReportDetails(currentSelectedPage.name, currentSelectedPage.objectName);
            } else {
                console.error('[ERROR] PagePreview - Unknown page type for:', currentSelectedPage.name);
            }
        }
        
        // View form details
        function viewFormDetails(formName, objectName) {
            console.log('[DEBUG] PagePreview - View form details requested:', formName, objectName);
            
            if (typeof vscode !== 'undefined') {
                vscode.postMessage({
                    command: 'showFormDetails',
                    formName: formName,
                    objectName: objectName
                });
            }
        }
        
        // View report details
        function viewReportDetails(reportName, objectName) {
            console.log('[DEBUG] PagePreview - View report details requested:', reportName, objectName);
            
            if (typeof vscode !== 'undefined') {
                vscode.postMessage({
                    command: 'showReportDetails',
                    reportName: reportName,
                    objectName: objectName
                });
            }
        }
        
        // Toggle filter section collapse/expand
        function toggleFilters() {
            const filterContent = document.getElementById('filterContent');
            const collapseButton = document.querySelector('.filter-collapse-button');
            
            if (!filterContent || !collapseButton) return;
            
            const isCollapsed = filterContent.style.display === 'none';
            
            if (isCollapsed) {
                filterContent.style.display = 'block';
                collapseButton.textContent = '▼';
                collapseButton.title = 'Collapse Filters';
            } else {
                filterContent.style.display = 'none';
                collapseButton.textContent = '▶';
                collapseButton.title = 'Expand Filters';
            }
        }
        
        // Clear all filter inputs
        function clearFilters() {
            console.log('[DEBUG] PagePreview - Clearing all filters');
            
            const filterInputs = document.querySelectorAll('.filter-input');
            filterInputs.forEach(input => {
                if (input.tagName.toLowerCase() === 'select') {
                    input.value = '';
                } else {
                    input.value = '';
                }
            });
        }
        
        // Execute filter search (placeholder for actual filtering logic)
        function searchFilters() {
            console.log('[DEBUG] PagePreview - Executing filter search');
            
            // Get all filter values
            const filterValues = {};
            const filterInputs = document.querySelectorAll('.filter-input');
            
            filterInputs.forEach(input => {
                const label = input.closest('.filter-field').querySelector('.filter-label').textContent;
                filterValues[label] = input.value;
            });
            
            console.log('[DEBUG] PagePreview - Filter values:', filterValues);
            
            // In a real implementation, this would filter the report data
            // For preview, we just log the action
            alert('Filter search executed. In a real report, this would filter the data based on the selected criteria.');
        }
        
        // Sort report grid by column
        function sortReportGrid(columnIndex) {
            console.log('[DEBUG] PagePreview - Sorting grid by column:', columnIndex);
            
            const table = document.getElementById('reportGrid');
            if (!table) return;
            
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const header = table.querySelector('thead th[data-column="' + columnIndex + '"]');
            
            if (!header || rows.length === 0) return;
            
            // Determine sort direction
            let sortDirection = 'asc';
            if (header.classList.contains('sort-asc')) {
                sortDirection = 'desc';
            }
            
            // Clear all sort indicators
            table.querySelectorAll('th.sortable').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Add sort indicator to current column
            header.classList.add('sort-' + sortDirection);
            
            // Sort rows (no row number column)
            const sortedRows = rows.sort((a, b) => {
                const cellA = a.cells[columnIndex]; // Direct column index
                const cellB = b.cells[columnIndex];
                
                if (!cellA || !cellB) return 0;
                
                let valueA = cellA.textContent.trim();
                let valueB = cellB.textContent.trim();
                
                // Try to parse as numbers if possible
                const numA = parseFloat(valueA.replace(/[$,]/g, ''));
                const numB = parseFloat(valueB.replace(/[$,]/g, ''));
                
                if (!isNaN(numA) && !isNaN(numB)) {
                    return sortDirection === 'asc' ? numA - numB : numB - numA;
                }
                
                // Parse dates
                const dateA = new Date(valueA);
                const dateB = new Date(valueB);
                
                if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
                }
                
                // String comparison
                const result = valueA.localeCompare(valueB);
                return sortDirection === 'asc' ? result : -result;
            });
            
            // Re-append sorted rows
            sortedRows.forEach((row) => {
                tbody.appendChild(row);
            });
        }
        
        // Pagination functions for report grid
        function changeItemsPerPage() {
            console.log('[DEBUG] PagePreview - Items per page changed');
            const select = document.getElementById('itemsPerPage');
            const itemsPerPage = parseInt(select.value);
            
            // In a real implementation, this would reload the data with new page size
            alert('Items per page changed to: ' + itemsPerPage + '. In a real report, this would reload the data.');
        }
        
        function goToFirstPage() {
            console.log('[DEBUG] PagePreview - Go to first page');
            updatePaginationInfo(1);
            alert('Navigate to first page. In a real report, this would load the first page of data.');
        }
        
        function goToPreviousPage() {
            console.log('[DEBUG] PagePreview - Go to previous page');
            // Simulate going to previous page
            alert('Navigate to previous page. In a real report, this would load the previous page of data.');
        }
        
        function goToNextPage() {
            console.log('[DEBUG] PagePreview - Go to next page');
            updatePaginationInfo(2);
            alert('Navigate to next page. In a real report, this would load the next page of data.');
        }
        
        function goToLastPage() {
            console.log('[DEBUG] PagePreview - Go to last page');
            updatePaginationInfo(15); // Simulate page 15 as last page
            alert('Navigate to last page. In a real report, this would load the last page of data.');
        }
        
        function updatePaginationInfo(currentPage) {
            const paginationInfo = document.querySelector('.pagination-info');
            const totalPages = 15; // Simulate 15 total pages
            
            if (paginationInfo) {
                paginationInfo.textContent = 'Page ' + currentPage + ' of ' + totalPages;
            }
            
            // Update row count info
            const rowCountInfo = document.querySelector('.row-count-info');
            if (rowCountInfo) {
                const itemsPerPage = parseInt(document.getElementById('itemsPerPage').value) || 10;
                const totalRows = 234; // Simulate total available rows
                const startRow = (currentPage - 1) * itemsPerPage + 1;
                const endRow = Math.min(currentPage * itemsPerPage, totalRows);
                
                rowCountInfo.textContent = 'Showing ' + startRow + ' - ' + endRow + ' of ' + totalRows + ' rows';
            }
        }
        
        // Handle messages from extension
        if (typeof vscode !== 'undefined') {
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'updatePageData':
                        console.log('[DEBUG] PagePreview - Received page data update');
                        allPages = message.data.pages;
                        updatePageDropdown();
                        break;
                }
            });
        }
        
        function exportToCSV() {
            console.log('[DEBUG] PagePreview - Export to CSV started');
            
            try {
                // Get the table
                const table = document.querySelector('.report-grid table');
                if (!table) {
                    alert('No table found to export.');
                    return;
                }
                
                // Get headers (skip row number column if it exists)
                const headers = [];
                const headerCells = table.querySelectorAll('thead th');
                headerCells.forEach((th, index) => {
                    if (!th.classList.contains('row-number')) {
                        headers.push(th.textContent.trim());
                    }
                });
                
                // Get data rows (skip row number column if it exists)
                const rows = [];
                const dataRows = table.querySelectorAll('tbody tr');
                dataRows.forEach(tr => {
                    const rowData = [];
                    const cells = tr.querySelectorAll('td');
                    cells.forEach((td, index) => {
                        // Skip row number column
                        const correspondingHeader = table.querySelector('thead th:nth-child(' + (index + 1) + ')');
                        if (!correspondingHeader || !correspondingHeader.classList.contains('row-number')) {
                            // Clean the cell value and handle commas in CSV
                            let cellValue = td.textContent.trim();
                            // Escape quotes and wrap in quotes if contains comma, quote, or newline
                            if (cellValue.includes('"')) {
                                cellValue = cellValue.replace(/"/g, '""');
                            }
                            if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\\n') || cellValue.includes('\\r')) {
                                cellValue = '"' + cellValue + '"';
                            }
                            rowData.push(cellValue);
                        }
                    });
                    rows.push(rowData);
                });
                
                // Create CSV content
                let csvContent = '';
                
                // Add headers
                csvContent += headers.join(',') + '\\n';
                
                // Add data rows
                rows.forEach(row => {
                    csvContent += row.join(',') + '\\n';
                });
                
                // Create and download the file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                
                // Create a unique filename with timestamp
                const now = new Date();
                const timestamp = now.getFullYear() + 
                    String(now.getMonth() + 1).padStart(2, '0') + 
                    String(now.getDate()).padStart(2, '0') + '_' +
                    String(now.getHours()).padStart(2, '0') + 
                    String(now.getMinutes()).padStart(2, '0') + 
                    String(now.getSeconds()).padStart(2, '0');
                
                const filename = 'report_export_' + timestamp + '.csv';
                
                if (link.download !== undefined) {
                    // Feature detection for download attribute
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    console.log('[DEBUG] PagePreview - CSV exported as ' + filename);
                } else {
                    // Fallback for older browsers
                    alert('CSV export is not supported in this browser. Please use a modern browser.');
                }
                
            } catch (error) {
                console.error('[ERROR] PagePreview - Export to CSV failed:', error);
                alert('Failed to export CSV. Please try again.');
            }
        }
    </script>
    `;
}

module.exports = {
    generateHTMLContent
};
