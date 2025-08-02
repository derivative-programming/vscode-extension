# Property Modal Architecture Notes

## Add Property Modal Structure
- Located in `src/webviews/objects/components/templates/`
- Template: `propertyModalTemplate.js` - HTML structure
- Functionality: `propertyModalFunctionality.js` - JavaScript behavior  
- Integration: Called from `saveSubmitHandlers.js` via `createPropertyModal()`

## Current Tabs
1. **Single Property**: Basic property with name only
2. **Bulk Add**: Multiple basic properties

## Missing Lookup Tab (TODO)
The modal needs a third tab for foreign key/lookup properties:
- Target object selection dropdown (from model data objects)
- Target property selection dropdown (from selected object properties)
- Auto-populates: isFK="true", isFKLookup="true", fKObjectName, fKObjectPropertyName
- Sample structure from todo.md:
```json
{
  "fKObjectName": "DataSourceType",
  "fKObjectPropertyName": "DataSourceTypeID", 
  "isFK": "true",
  "isFKLookup": "true",
  "name": "DataSourceTypeID"
}
```

## Property Management Flow
1. Modal created by `createPropertyModal()` 
2. Property added via `addNewProperty(propName)`
3. Property Management functions in `propertyManagement.js`
4. Table/list views updated with new property
5. Checkbox behavior initialized for new row
6. Model updated via `vscode.postMessage()` with 'updateModel' command

## Schema Integration
- Property schema defined in `app-dna.schema.json` 
- FK properties have additional fields: `fKObjectName`, `fKObjectPropertyName`, `isFK`, `isFKLookup`
- Property validation uses schema enum values for dropdowns
- Default values and descriptions come from schema
