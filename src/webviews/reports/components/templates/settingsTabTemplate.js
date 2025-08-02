"use strict";
const { formatLabel } = require("../../helpers/reportDataHelper");

/**
 * Gets the list of report properties that should not be editable or visible on the settings tab
 * Based on C# GetReportPropertiesToIgnore() method
 * @returns {Array<string>} Array of property names to ignore (lowercase)
 */
function getReportPropertiesToIgnore() {
    return [
        "name",
        "initobjectworkflowname",
        "iscachingallowed",
        "cacheexpirationinminutes",
        "badgecountpropertyname",
        "isheaderlabelsvisible",
        "isreportdetaillabelcolumnvisible",
        "formintrotext",
        "isignoredindocumentation",
        "isazureblobstorageused",
        "azuretablenameoverride",
        "isazuretableprimarykeycolumndatetime",
        "visualizationgridgroupbycolumnname",
        "visualizationgridgroupbyinfotextcolumnname",
        "visualizationpiechartslicevaluecolumnname",
        "visualizationpiechartslicedescriptioncolumnname",
        "visualizationlinechartutcdatetimecolumnname",
        "visualizationlinechartvaluecolumnname",
        "visualizationlinechartdescriptioncolumnname",
        "isvisualizationlinechartgridhorizlinehidden",
        "isvisualizationlinechartgridverticallinehidden",
        "isvisualizationlinechartlegendhidden",
        "isvisualizationlinechartstairlines",
        "visualizationlinechartgridverticalmaxvalue",
        "visualizationlinechartgridverticalminvalue",
        "visualizationlinechartgridverticalstepvalue",
        "isvisualizationlinechartverticallabelshidden",
        "visualizationlinechartgridverticaltitle",
        "visualizationlinechartgridhoriztitle",
        "visualizationlinechartgridverticalmaxvallabel",
        "visualizationlinechartgridverticalminvallabel",
        "isvisualizationlinechartgridverticalmaxdynamic",
        "visualizationflowchartsourcenodecodecolumnname",
        "visualizationflowchartsourcenodedescriptioncolumnname",
        "visualizationflowchartsourcenodecolorcolumnname",
        "visualizationflowchartflowdescriptioncolumnname",
        "visualizationflowchartdestinationnodecodecolumnname",
        "visualizationcardviewtitlecolumn",
        "visualizationcardviewdescriptioncolumn",
        "visualizationcardviewisimageavailable",
        "visualizationcardviewimagecolumn",
        "visualizationcardviewgroupbycolumnname",
        "visualizationcardviewgroupbyinfotextcolumnname",
        "visualizationfolderidcolumnname",
        "visualizationfoldernamecolumnname",
        "visualizationfolderparentidcolumnname",
        "visualizationfolderisfoldercolumnname",
        "visualizationfolderisdragdropallowed",
        "visualizationfolderdragdropeventcontextobjectname",
        "visualizationfolderdragdropeventtargetname",
        "ispage"
    ];
}

/**
 * Generates the HTML for the settings tab
 * @param {Object} report The report data excluding complex properties
 * @param {Object} reportSchemaProps The report schema properties
 * @returns {string} HTML for the settings tab
 */
function getSettingsTabTemplate(report, reportSchemaProps) {
    const propertiesToIgnore = getReportPropertiesToIgnore();
    
    return Object.entries(reportSchemaProps)
        .filter(([prop, schema]) => {
            // Skip array properties as they have their own tabs
            if (prop === 'reportColumn' || prop === 'reportButton' || prop === 'reportParam') {
                return false;
            }
            
            // Skip properties that should not be editable or visible
            if (propertiesToIgnore.includes(prop.toLowerCase())) {
                return false;
            }
            
            return true;
        })
        .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically by property name
        .map(([prop, schema]) => {
            // Check if property has enum values
            const hasEnum = schema.enum && Array.isArray(schema.enum);
            
            // Get description for tooltip
            const tooltip = schema.description ? `title="${schema.description}"` : "";
            
            // Check if the property exists in the report object
            const propertyExists = report.hasOwnProperty(prop) && report[prop] !== null && report[prop] !== undefined;
            
            // Generate appropriate input field based on whether it has enum values
            let inputField = "";
            if (hasEnum) {
                // Generate select dropdown for enum values
                inputField = `<select id="setting-${prop}" name="${prop}" ${tooltip} ${!propertyExists ? "readonly disabled" : ""}>
                    ${schema.enum
                        .slice() // Create a copy to avoid mutating the original array
                        .sort() // Sort alphabetically
                        .map(option => {
                        const isSelected = report[prop] === option;
                        return `<option value="${option}" ${isSelected ? "selected" : ""}>${option}</option>`;
                    }).join("")}
                </select>`;
            } else {
                // Generate text input for non-enum values
                inputField = `<input type="text" id="setting-${prop}" name="${prop}" value="${propertyExists ? report[prop] : ""}" ${tooltip} ${!propertyExists ? "readonly" : ""}>`;
            }
            
            // If the property exists, add a data attribute to indicate it was originally checked
            // This will help prevent unchecking properties that already exist
            const originallyChecked = propertyExists ? "data-originally-checked=\"true\"" : "";
            
            return `<div class="form-row">
                <label for="setting-${prop}" ${tooltip}>${formatLabel(prop)}:</label>
                ${inputField}
                <input type="checkbox" class="setting-checkbox" data-prop="${prop}" data-is-enum="${hasEnum}" ${propertyExists ? "checked disabled" : ""} ${originallyChecked} style="margin-left: 5px; transform: scale(0.8);" title="Toggle property existence">
            </div>`;
        }).join("");
}

module.exports = {
    getSettingsTabTemplate,
    getReportPropertiesToIgnore
};
