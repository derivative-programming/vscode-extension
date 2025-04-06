// Fix the template string by properly escaping the HTML or using proper string concatenation
function createPropertyEditTemplate(prop, propertyDescriptions) {
    const nameDesc = propertyDescriptions[`prop.${prop.name}`] || '';
    const fkObjectDesc = propertyDescriptions['prop.fKObjectName'] || '';
    
    return `
        <div class="property-edit-container">
            <div class="form-group">
                <label for="name">Name</label>
                <div class="input-tooltip-container">
                    <input type="text" name="name" value="${prop.name || ''}">
                    ${nameDesc ? `<span class="tooltip-text">${nameDesc}</span>` : ''}
                </div>
            </div>
        </div>
    `.trim();
}