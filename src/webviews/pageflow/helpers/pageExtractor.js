// pageExtractor.js
// Helper functions for extracting pages from model data
// Created: July 13, 2025

"use strict";

/**
 * Extracts pages from model objects (forms and reports with isPage=true)
 * @param {Array} allObjects Array of all objects from the model
 * @returns {Array} Array of page objects
 */
function extractPagesFromModel(allObjects) {
    const pages = [];
    console.log('[DEBUG] extractPagesFromModel - processing', allObjects.length, 'objects');
    
    allObjects.forEach((obj, index) => {
        console.log(`[DEBUG] Object ${index}: ${obj.name}, has objectWorkflow:`, !!obj.objectWorkflow, 'has report:', !!obj.report);
        
        // Extract forms (object workflows - only those with isPage=true)
        if (obj.objectWorkflow && Array.isArray(obj.objectWorkflow)) {
            console.log(`[DEBUG] Object ${obj.name} has ${obj.objectWorkflow.length} objectWorkflow items`);
            obj.objectWorkflow.forEach((workflow, wIndex) => {
                console.log(`[DEBUG] Workflow ${wIndex}: ${workflow.name}, isPage: ${workflow.isPage}`);
                if (workflow.isPage === "true") {
                    const page = {
                        name: workflow.name,
                        titleText: workflow.titleText || workflow.name,
                        introText: workflow.introText,
                        formTitleText: workflow.formTitleText,
                        formIntroText: workflow.formIntroText,
                        type: 'form',
                        objectName: obj.name,
                        parameters: workflow.objectWorkflowParam || [],
                        buttons: extractButtonsFromWorkflow(workflow),
                        roleRequired: workflow.roleRequired,
                        isLoginPage: workflow.isLoginPage,
                        isPage: workflow.isPage
                    };
                    console.log('[DEBUG] Adding form page:', page);
                    pages.push(page);
                }
            });
        }
        
        // Extract reports with isPage=true
        if (obj.report && Array.isArray(obj.report)) {
            console.log(`[DEBUG] Object ${obj.name} has ${obj.report.length} report items`);
            obj.report.forEach((report, rIndex) => {
                console.log(`[DEBUG] Report ${rIndex}: ${report.name}, isPage: ${report.isPage}`);
                if (report.isPage === "true") {
                    const page = {
                        name: report.name,
                        titleText: report.titleText || report.name,
                        introText: report.introText,
                        formTitleText: report.formTitleText,
                        formIntroText: report.formIntroText,
                        type: 'report',
                        visualizationType: report.visualizationType || 'grid', // Default to grid if not specified
                        objectName: obj.name,
                        buttons: extractButtonsFromReport(report),
                        roleRequired: report.roleRequired,
                        isPage: report.isPage
                    };
                    console.log('[DEBUG] Adding report page:', page);
                    pages.push(page);
                }
            });
        }
    });
    
    console.log('[DEBUG] extractPagesFromModel - returning', pages.length, 'pages');
    return pages;
}

/**
 * Extracts buttons with destination targets from a workflow
 * @param {Object} workflow Object workflow
 * @returns {Array} Array of button objects with destinations
 */
function extractButtonsFromWorkflow(workflow) {
    const buttons = [];
    
    // Extract object workflow buttons with destination targets
    if (workflow.objectWorkflowButton && Array.isArray(workflow.objectWorkflowButton)) {
        workflow.objectWorkflowButton.forEach(button => {
            // Only include buttons that have destination targets and are visible and not ignored
            if (button.destinationTargetName && 
                (!button.hasOwnProperty('isVisible') || button.isVisible !== "false") && 
                (!button.hasOwnProperty('isIgnored') || button.isIgnored !== "true")) {
                buttons.push({
                    buttonName: button.buttonText || 'Button',
                    buttonText: button.buttonText,
                    buttonType: button.buttonType || 'other',
                    destinationTargetName: button.destinationTargetName,
                    destinationContextObjectName: button.destinationContextObjectName
                });
            }
        });
    }
    
    return buttons;
}

/**
 * Extracts buttons with destination targets from a report
 * @param {Object} report Report object
 * @returns {Array} Array of button objects with destinations
 */
function extractButtonsFromReport(report) {
    const buttons = [];
    
    // Extract report buttons (excluding breadcrumb buttons as requested)
    if (report.reportButton && Array.isArray(report.reportButton)) {
        report.reportButton.forEach(button => {
            // Only include buttons that have destination targets, are not breadcrumb buttons, and are visible and not ignored
            if (button.destinationTargetName && 
                button.buttonType !== "breadcrumb" &&
                (!button.hasOwnProperty('isVisible') || button.isVisible !== "false") && 
                (!button.hasOwnProperty('isIgnored') || button.isIgnored !== "true")) {
                buttons.push({
                    buttonName: button.buttonName || button.buttonText,
                    buttonText: button.buttonText,
                    buttonType: button.buttonType,
                    destinationTargetName: button.destinationTargetName,
                    destinationContextObjectName: button.destinationContextObjectName
                });
            }
        });
    }
    
    // Extract report column buttons with destinations
    if (report.reportColumn && Array.isArray(report.reportColumn)) {
        report.reportColumn.forEach(column => {
            // Only include column buttons that have destination targets and are visible and not ignored
            if (column.isButton === "true" && 
                column.destinationTargetName &&
                (!column.hasOwnProperty('isVisible') || column.isVisible !== "false") && 
                (!column.hasOwnProperty('isIgnored') || column.isIgnored !== "true")) {
                buttons.push({
                    buttonName: column.name,
                    buttonText: column.buttonText,
                    buttonType: 'column',
                    destinationTargetName: column.destinationTargetName,
                    destinationContextObjectName: column.destinationContextObjectName
                });
            }
        });
    }
    
    return buttons;
}

module.exports = {
    extractPagesFromModel,
    extractButtonsFromWorkflow,
    extractButtonsFromReport
};
