# Checkbox Behavior Implementation

## Property Toggle Checkboxes in Table Views
When implementing property toggle checkboxes in table views (Forms, Reports, Objects), the following pattern must be followed for correct behavior:

1. **Template Implementation**: Checkboxes must use `"checked disabled"` when property exists:
   ```javascript
   `<input type="checkbox" class="property-checkbox" ${propertyExists ? "checked disabled" : ""} ${originallyChecked}>`
   ```

2. **Event Handler Implementation**: Must prevent unchecking of existing properties:
   ```javascript
   checkbox.addEventListener('change', function() {
       // Don't allow unchecking of properties that already exist in the model
       if (this.hasAttribute('data-originally-checked')) {
           this.checked = true;
           return;
       }
       
       if (this.checked) {
           // Enable input and disable checkbox to prevent unchecking
           this.disabled = true;
           this.setAttribute('data-originally-checked', 'true');
       }
   });
   ```

3. **CSS Class Names**: Different views use different class names:
   - Forms parameters: `property-toggle`
   - Forms buttons: `button-checkbox`
   - Forms output variables: `outputvar-checkbox`
   - Reports columns: `column-checkbox`
   - Reports buttons: `button-checkbox`
   - Objects properties: `prop-checkbox`

This pattern ensures users cannot accidentally remove existing properties from the model, only add new ones.
