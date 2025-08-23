"use strict";
// generalFlow paramsListTemplate reuse forms – touch for rebuild

// Reuse forms params list template generator
function getParamsListTemplate(paramSchema) {
    const { getParamsListTemplate: getFormParamsListTemplate } = require("../../../forms/components/templates/paramsListTemplate");
    return typeof getFormParamsListTemplate === 'function' ? getFormParamsListTemplate(paramSchema) : "";
}

module.exports = { getParamsListTemplate };
