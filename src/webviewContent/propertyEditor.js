// Fix template literal syntax issues
function generatePropertyForm(property, descriptions) {
  const nameDesc = descriptions[`prop.${property.name}`] || '';
  
  // Properly escape nested template literals and ensure HTML is well-formed
  return `
    <form class="property-form">
      <div class="form-group">
        <label for="name">Name</label>
        <div class="input-tooltip-container">
          <input type="text" name="name" value="${property.name || ''}" ${!property.editable ? 'disabled' : ''}>
          ${nameDesc ? `<div class="tooltip">${nameDesc}</div>` : ''}
        </div>
      </div>
      <!-- More form fields -->
      <div class="form-group">
        <label for="type">Type</label>
        <div class="input-tooltip-container">
          <select name="type">
            <option value="string" ${property.type === 'string' ? 'selected' : ''}>String</option>
            <option value="number" ${property.type === 'number' ? 'selected' : ''}>Number</option>
            <option value="boolean" ${property.type === 'boolean' ? 'selected' : ''}>Boolean</option>
            <option value="date" ${property.type === 'date' ? 'selected' : ''}>Date</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit">Save</button>
      </div>
    </form>
  `;
}