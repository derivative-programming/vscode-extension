// Test script to check the complete generated JavaScript output

const { getClientScriptTemplate } = require("./src/webviews/objects/components/templates/clientScriptTemplate");

// Mock data for testing
const props = [];
const propItemsSchema = { name: { type: "string" }, description: { type: "string" } };
const objectName = "TestObject";
const allObjects = [];
const objectData = {};
const lookupItemsSchema = { name: { type: "string" }, value: { type: "string" } };

console.log("=== Generated Client Script ===");
const result = getClientScriptTemplate(props, propItemsSchema, objectName, allObjects, objectData, lookupItemsSchema);
console.log(result);
console.log("=== End of Generated Script ===");
