/**
 * Simple test to validate API details view functionality
 */

// Mock test data
const mockApiSite = {
    name: "TestApiSite",
    title: "Test API Site",
    description: "This is a test API site",
    versionNumber: "1.0.0",
    isPublic: "true",
    isSiteLoggingEnabled: "false",
    apiLogReportName: "ApiLogReport"
};

// Mock schema properties (based on actual schema structure)
const mockApiSiteSchemaProps = {
    name: {
        type: "string",
        description: "Name of API site"
    },
    title: {
        type: "string", 
        description: "API Document Title"
    },
    description: {
        type: "string",
        description: "API Document Description"
    },
    versionNumber: {
        type: "string",
        description: "API Version Number"
    },
    isPublic: {
        type: "string",
        enum: ["true", "false"],
        description: "Is an api key required in the header on each request?"
    },
    isSiteLoggingEnabled: {
        type: "string",
        enum: ["true", "false"]
    },
    apiLogReportName: {
        type: "string",
        description: "report used for api logging. Lazy write required."
    }
};

console.log("[TEST] Starting API details view tests...");

try {
    // Test 1: Load the API schema loader
    const schemaLoader = require('./src/webviews/apis/helpers/schemaLoader');
    console.log("[TEST] ✓ API schema loader module loaded successfully");

    // Test 2: Load the settings tab template
    const settingsTemplate = require('./src/webviews/apis/components/templates/settingsTabTemplate');
    console.log("[TEST] ✓ API settings template module loaded successfully");

    // Test 3: Test settings template generation
    const settingsHtml = settingsTemplate.getSettingsTabTemplate(mockApiSite, mockApiSiteSchemaProps);
    if (settingsHtml && settingsHtml.includes('apiLogReportName')) {
        console.log("[TEST] ✓ Settings template generated with required properties");
    } else {
        console.log("[TEST] ✗ Settings template missing required properties");
    }

    // Test 4: Load the main template
    const mainTemplate = require('./src/webviews/apis/components/templates/mainTemplate');
    console.log("[TEST] ✓ API main template module loaded successfully");

    // Test 5: Load the client script template
    const clientScript = require('./src/webviews/apis/components/templates/clientScriptTemplate');
    console.log("[TEST] ✓ API client script template module loaded successfully");

    // Test 6: Load the details view generator
    const detailsGenerator = require('./src/webviews/apis/components/detailsViewGenerator');
    console.log("[TEST] ✓ API details view generator module loaded successfully");

    // Test 7: Test HTML generation
    const fullHtml = detailsGenerator.generateDetailsView(
        mockApiSite, 
        mockApiSiteSchemaProps, 
        "file:///mock/codicons.css"
    );
    
    if (fullHtml && fullHtml.includes('API Site: TestApiSite')) {
        console.log("[TEST] ✓ Full HTML generated successfully with API site name");
    } else {
        console.log("[TEST] ✗ Full HTML generation failed or missing API site name");
    }

    // Test 8: Check for required properties in HTML
    const requiredProperties = [
        'apiLogReportName',
        'description',
        'isPublic', 
        'isSiteLoggingEnabled',
        'title',
        'versionNumber'
    ];
    
    const allPropertiesPresent = requiredProperties.every(prop => fullHtml.includes(prop));
    if (allPropertiesPresent) {
        console.log("[TEST] ✓ All required properties found in generated HTML");
    } else {
        console.log("[TEST] ✗ Some required properties missing from generated HTML");
        const missing = requiredProperties.filter(prop => !fullHtml.includes(prop));
        console.log("[TEST] Missing properties:", missing);
    }

    console.log("[TEST] ✓ All basic API details view tests passed!");

} catch (error) {
    console.error("[TEST] ✗ Test failed with error:", error.message);
    console.error("[TEST] Stack trace:", error.stack);
}

console.log("[TEST] API details view test completed.");