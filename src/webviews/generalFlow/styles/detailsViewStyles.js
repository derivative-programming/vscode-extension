"use strict";

// Reuse the same details view styles as forms/pageinits for consistency
function getDetailViewStyles() {
    const { getDetailViewStyles: getFormStyles } = require("../../forms/styles/detailsViewStyles");
    return typeof getFormStyles === 'function' ? getFormStyles() : "";
}

module.exports = { getDetailViewStyles };
