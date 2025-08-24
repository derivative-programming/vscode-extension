"use strict";
// generalFlow outputVarsListTemplate – follow Page Init pattern for optional items

function getOutputVarsListTemplate(outputVarSchema) {
    const { getOutputVarsListTemplate: getPageInitOutputVarsListTemplate } = require("../../../pageinits/components/templates/outputVarsTableTemplate");
    return typeof getPageInitOutputVarsListTemplate === 'function' ? getPageInitOutputVarsListTemplate(outputVarSchema) : "";
}

module.exports = { getOutputVarsListTemplate };
