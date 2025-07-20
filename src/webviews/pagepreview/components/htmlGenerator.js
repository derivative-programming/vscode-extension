// htmlGenerator.js
// HTML generator for page preview view
// Generates HTML content with role filtering and form/report dropdown
// Created: July 20, 2025

"use strict";

/**
 * Generates the complete HTML content for the page preview view
 * @param {Array} pages Array of page objects from pageExtractor
 * @param {Array} allObjects Array of all objects from model
 * @returns {string} Complete HTML content for the webview
 */
function generateHTMLContent(pages, allObjects) {
    const uniqueRoles = [...new Set(pages.map(page => page.roleRequired).filter(role => role))];
    const hasPublicPages = pages.some(page => !page.roleRequired);
    
    console.log('[DEBUG] PagePreview HTML Generator - Unique roles:', uniqueRoles);
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
                        ${generateRoleFilterHTML(uniqueRoles, hasPublicPages)}
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
        
        ${generateJavaScript(pages, allObjects)}
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
 * @param {Array} pages Array of page objects
 * @param {Array} allObjects Array of all objects from model
 * @returns {string} JavaScript code block
 */
function generateJavaScript(pages, allObjects) {
    // Sanitize pages data to prevent JavaScript errors
    const sanitizedPages = pages.map(page => ({
        name: page.name || '',
        titleText: page.titleText || '',
        introText: page.introText || '',
        formTitleText: page.formTitleText || '',
        formIntroText: page.formIntroText || '',
        type: page.type || 'form',
        objectName: page.objectName || '',
        parameters: (page.parameters || []).map(param => ({
            name: param.name || '',
            labelText: param.labelText || '',
            sqlServerDBDataType: param.sqlServerDBDataType || '',
            sqlServerDBDataTypeSize: param.sqlServerDBDataTypeSize || '',
            isRequired: param.isRequired || 'false',
            isVisible: param.isVisible || 'true',
            isIgnored: param.isIgnored || 'false',
            isReadOnly: param.isReadOnly || 'false',
            isFKLookup: param.isFKLookup || 'false',
            isFKList: param.isFKList || 'false',
            isEncrypted: param.isEncrypted || 'false',
            defaultValue: param.defaultValue || '',
            codeDescription: param.codeDescription || '',
            detailsText: param.detailsText || '',
            isSecured: param.isSecured || 'false',
            inputControl: param.inputControl || ''
        })),
        buttons: (page.buttons || []).map(button => ({
            buttonName: button.buttonName || '',
            buttonText: button.buttonText || '',
            isVisible: button.isVisible || 'true',
            isButtonCallToAction: button.isButtonCallToAction || 'false',
            destinationTargetName: button.destinationTargetName || '',
            destinationContextObjectName: button.destinationContextObjectName || ''
        })),
        roleRequired: page.roleRequired || '',
        visualizationType: page.visualizationType || 'grid'
    }));

    return `
    <script>
        // Global variables
        let allPages = ${JSON.stringify(sanitizedPages, null, 2)};
        let selectedRoles = new Set(['PUBLIC', ${pages.map(p => p.roleRequired).filter(r => r).map(r => `'${r}'`).join(', ')}]);
        let currentSelectedPage = null;
        
        console.log('[DEBUG] PagePreview - Initialized with pages:', allPages);
        console.log('[DEBUG] PagePreview - Initial selected roles:', Array.from(selectedRoles));
        
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
                option.setAttribute('data-type', page.type);
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
            
            if (selectedPage.type === 'form') {
                showFormPreview(selectedPage);
            } else if (selectedPage.type === 'report') {
                showReportPreview(selectedPage);
            } else {
                console.warn('[WARN] PagePreview - Unknown page type:', selectedPage.type);
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
        
        // Generate HTML for form preview
        function generateFormPreviewHTML(page) {
            console.log('[DEBUG] PagePreview - Generating form preview HTML for:', page.name);
            
            let html = '<div class="page-preview-container">';
            
            // Page header section (outside the form)
            html += '<div class="page-header">';
            if (page.titleText) {
                html += '<h1 class="page-title">' + page.titleText + '</h1>';
            }
            if (page.introText) {
                html += '<p class="page-intro">' + page.introText + '</p>';
            }
            html += '</div>';
            
            // Form container (the actual form)
            html += '<div class="form-preview">';
            
            // Form header section
            if (page.formTitleText || page.formIntroText) {
                html += '<div class="form-header">';
                if (page.formTitleText) {
                    html += '<h2 class="form-title">' + page.formTitleText + '</h2>';
                }
                if (page.formIntroText) {
                    html += '<p class="form-intro">' + page.formIntroText + '</p>';
                }
                html += '</div>';
            }
            
            // Form parameters section with actual fields
            if (page.parameters && page.parameters.length > 0) {
                html += '<div class="form-section">';
                
                page.parameters.forEach(param => {
                    if (param.isIgnored === "true" || param.isVisible !== "true") {
                        return; // Skip ignored or hidden parameters
                    }
                    
                    html += '<div class="form-field">';
                    
                    // Field label
                    const labelText = param.labelText || param.name || 'Field';
                    const isRequired = param.isRequired === "true";
                    html += '<label class="form-field-label">' + labelText + (isRequired ? ' *' : '') + '</label>';
                    
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
            
            // Form buttons section
            if (page.buttons && page.buttons.length > 0) {
                html += '<div class="form-section">';
                html += '<div class="form-buttons">';
                
                page.buttons.forEach(button => {
                    // Only show buttons that are visible
                    if (button.isVisible !== "true") {
                        return; // Skip hidden buttons
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
                html += '<span class="checkbox-label">' + (param.labelText || param.name || 'Yes/No') + '</span>';
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
        
        // Generate HTML for report preview (placeholder)
        function generateReportPreviewHTML(page) {
            console.log('[DEBUG] PagePreview - Generating report preview HTML for:', page.name);
            
            const roleText = page.roleRequired ? ' (Role: ' + page.roleRequired + ')' : ' (Public)';
            
            let html = '<div class="form-preview">';
            
            // Report header
            html += '<div class="form-header">';
            html += '<h2 class="form-title">' + (page.titleText || page.name) + '</h2>';
            html += '<p class="form-subtitle">Report Preview' + roleText + '</p>';
            html += '</div>';
            
            // Placeholder content
            html += '<div class="empty-state">';
            html += '<p>Report preview functionality will be implemented in a future update.</p>';
            html += '<p>This report uses visualization type: <strong>' + (page.visualizationType || 'grid') + '</strong></p>';
            html += '</div>';
            
            html += '</div>';
            
            return html;
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
        
        // Handle view details button click
        function handleViewDetails() {
            console.log('[DEBUG] PagePreview - Handle view details clicked');
            
            if (!currentSelectedPage) {
                console.error('[ERROR] PagePreview - No page selected');
                return;
            }
            
            if (currentSelectedPage.type === 'form') {
                viewFormDetails(currentSelectedPage.name, currentSelectedPage.objectName);
            } else if (currentSelectedPage.type === 'report') {
                viewReportDetails(currentSelectedPage.name, currentSelectedPage.objectName);
            } else {
                console.error('[ERROR] PagePreview - Unknown page type:', currentSelectedPage.type);
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
    </script>
    `;
}

module.exports = {
    generateHTMLContent
};
