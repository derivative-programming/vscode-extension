"use strict";

const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getMainTemplate } = require("./templates/mainTemplate");
const { getClientScriptTemplate } = require("./templates/clientScriptTemplate");

/**
 * Generates the complete HTML for the API details view
 * @param {Object} apiSite The API site data object
 * @param {Object} apiSiteSchemaProps The API site schema properties
 * @param {string} codiconsUri URI for the codicon CSS file
 * @returns {string} Complete HTML document
 */
function generateDetailsView(apiSite, apiSiteSchemaProps, codiconsUri) {
    console.log("[DEBUG] generateApiDetailsView called with:", {
        apiSite: apiSite,
        apiSiteSchemaPropsKeys: apiSiteSchemaProps ? Object.keys(apiSiteSchemaProps) : []
    });
    
    try {
        // Ensure we have valid data
        if (!apiSite) {
            throw new Error("API site data is required");
        }
        
        if (!apiSiteSchemaProps) {
            throw new Error("API site schema properties are required");
        }
        
        const apiSiteName = (apiSite && apiSite.name) ? apiSite.name : 'Unknown API Site';
        console.log("[DEBUG] Using apiSiteName:", apiSiteName);
        
        // Generate the settings tab content using the template
        console.log("[DEBUG] Generating settings tab...");
        const settingsHtml = getSettingsTabTemplate(apiSite, apiSiteSchemaProps);
        
        // Get the main client script template
        const clientScript = getClientScriptTemplate(apiSite);
        
        // Generate the complete HTML document
        console.log("[DEBUG] Generating main template...");
        const result = getMainTemplate(
            apiSite,
            settingsHtml,
            clientScript,
            codiconsUri
        );
        
        console.log("[DEBUG] API details view generation complete");
        return result;
        
    } catch (error) {
        console.error("[ERROR] generateApiDetailsView failed:", error);
        return `
            <html>
                <body>
                    <div style="color: red; padding: 20px;">
                        <h2>Error generating API details view</h2>
                        <p>${error.message}</p>
                        <pre>${error.stack}</pre>
                    </div>
                </body>
            </html>
        `;
    }
}

module.exports = {
    generateDetailsView
};