"use strict";
// generalFlow modalTemplates reuse forms – touch for rebuild

function getParamModalHtml(paramSchema) {
    const { getAddInputControlModalHtml } = require("../../../forms/components/templates/addInputControlModalTemplate");
    // We rely on client script to attach functionality; just return the template
    return getAddInputControlModalHtml();
}

function getOutputVarModalHtml(outputVarSchema) {
    const { getAddOutputVariableModalHtml } = require("../../../forms/components/templates/addOutputVariableModalTemplate");
    return getAddOutputVariableModalHtml();
}

module.exports = { getParamModalHtml, getOutputVarModalHtml };
