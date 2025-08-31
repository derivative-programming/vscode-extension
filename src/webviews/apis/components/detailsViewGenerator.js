"use strict";

const { getSettingsTabTemplate } = require("./templates/settingsTabTemplate");
const { getMainTemplate } = require("./templates/mainTemplate");
const { getClientScriptTemplate } = require("./templates/clientScriptTemplate");
const { getEndpointsListTemplate } = require("./templates/endpointsListTemplate");
const { loadSchema, getApiEndPointSchema } = require("../helpers/schemaLoader");

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
        
        // Count endpoints
        const endpointCount = (apiSite.apiEndPoint && Array.isArray(apiSite.apiEndPoint)) ? apiSite.apiEndPoint.length : 0;
        console.log("[DEBUG] Found", endpointCount, "endpoints");
        
        // Load endpoint schema
        const schema = loadSchema();
        const endpointSchema = getApiEndPointSchema(schema);
        console.log("[DEBUG] Loaded endpoint schema with", Object.keys(endpointSchema).length, "properties");
        
        // Generate the settings tab content using the template
        console.log("[DEBUG] Generating settings tab...");
        const settingsHtml = getSettingsTabTemplate(apiSite, apiSiteSchemaProps);
        
        // Generate the endpoints list view fields
        console.log("[DEBUG] Generating endpoints list view...");
        const endpointListViewFields = getEndpointsListTemplate(endpointSchema);
        
        // Get the main client script template
        const clientScript = getClientScriptTemplate(apiSite, endpointSchema);
        
        // Generate the complete HTML document
        console.log("[DEBUG] Generating main template...");
        const result = getMainTemplate(
            apiSite,
            endpointCount,
            settingsHtml,
            endpointListViewFields,
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