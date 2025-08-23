"use strict";
// generalFlow outputVarsTableTemplate reuse forms – touch for rebuild

function getOutputVarsListTemplate(outputVarSchema) {
    const { getOutputVarsListTemplate: getFormOutputVarsListTemplate } = require("../../../forms/components/templates/outputVarsTableTemplate");
    return typeof getFormOutputVarsListTemplate === 'function' ? getFormOutputVarsListTemplate(outputVarSchema) : "";
}

module.exports = { getOutputVarsListTemplate };
