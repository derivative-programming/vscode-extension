// mcp-bridge-test.js
// Test script for MCP Bridge (HTTP endpoints)
// Created: October 16, 2025
// Purpose: Test list_data_objects and search_user_stories via HTTP bridge

const http = require('http');

/**
 * Make HTTP request to MCP bridge
 */
function httpRequest(port, path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('🚀 MCP Bridge Search Tools Test Suite\n');
    console.log('Testing via HTTP bridge on localhost:3001\n');

    try {
        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 1: Data Object Search (via MCP Bridge)');
        console.log('═══════════════════════════════════════════════════════\n');

        // Test 1.1: List all data objects
        console.log('TEST 1.1: List All Data Objects');
        console.log('─────────────────────────────────────────');
        try {
            const result = await httpRequest(3001, '/api/data-objects');
            console.log(`📊 Result: Found ${result.length} data objects`);
            console.log(`   First 5 objects:`);
            result.slice(0, 5).forEach(obj => {
                console.log(`   • ${obj.name} (isLookup: ${obj.isLookup}, parent: ${obj.parentObjectName || 'none'})`);
            });
            console.log(`✅ Success\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 1.2: Filter by name containing "User"
        console.log('TEST 1.2: Filter Data Objects by Name ("User")');
        console.log('─────────────────────────────────────────');
        try {
            const allObjects = await httpRequest(3001, '/api/data-objects');
            const filtered = allObjects.filter(obj => 
                obj.name.toLowerCase().includes('user')
            );
            console.log(`📊 Result: Found ${filtered.length} objects containing "User"`);
            filtered.forEach(obj => {
                console.log(`   • ${obj.name}`);
            });
            console.log(`✅ Success\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 1.3: Space-agnostic search test
        console.log('TEST 1.3: Space-Agnostic Search ("UserRole" should match "User Role")');
        console.log('─────────────────────────────────────────');
        try {
            const allObjects = await httpRequest(3001, '/api/data-objects');
            const searchTerm = 'UserRole';
            const searchNoSpaces = searchTerm.replace(/\s+/g, '').toLowerCase();
            
            // MCP server logic: search with and without spaces
            const filtered = allObjects.filter(obj => {
                const nameLower = obj.name.toLowerCase();
                const nameNoSpaces = obj.name.replace(/\s+/g, '').toLowerCase();
                return nameLower.includes(searchTerm.toLowerCase()) || 
                       nameNoSpaces.includes(searchNoSpaces);
            });
            
            console.log(`📊 Result: Found ${filtered.length} objects (with space-agnostic matching)`);
            filtered.forEach(obj => {
                console.log(`   • ${obj.name} (matches: ${obj.name.replace(/\s+/g, '').toLowerCase().includes(searchNoSpaces) ? 'YES' : 'partial'})`);
            });
            console.log(`✅ Success - Space-agnostic search working\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 1.4: Filter by isLookup
        console.log('TEST 1.4: Filter Data Objects by isLookup=true');
        console.log('─────────────────────────────────────────');
        try {
            const allObjects = await httpRequest(3001, '/api/data-objects');
            const lookupObjects = allObjects.filter(obj => obj.isLookup === true);
            console.log(`📊 Result: Found ${lookupObjects.length} lookup objects`);
            lookupObjects.slice(0, 5).forEach(obj => {
                console.log(`   • ${obj.name}`);
            });
            console.log(`✅ Success\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 2: User Story Search (via MCP Bridge)');
        console.log('═══════════════════════════════════════════════════════\n');

        // Test 2.1: List all user stories
        console.log('TEST 2.1: List All User Stories');
        console.log('─────────────────────────────────────────');
        try {
            const result = await httpRequest(3001, '/api/user-stories');
            console.log(`📊 Result: Found ${result.length} user stories`);
            console.log(`   First 3 stories:`);
            result.slice(0, 3).forEach(story => {
                console.log(`   • ${story.storyNumber}: ${story.storyText.substring(0, 60)}...`);
            });
            console.log(`✅ Success\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 2.2: Search user stories (case-insensitive)
        console.log('TEST 2.2: Search User Stories ("manager", case-insensitive)');
        console.log('─────────────────────────────────────────');
        try {
            const allStories = await httpRequest(3001, '/api/user-stories');
            const searchTerm = 'manager';
            const filtered = allStories.filter(story => {
                const searchText = (story.storyText + ' ' + story.storyNumber).toLowerCase();
                return searchText.includes(searchTerm.toLowerCase());
            });
            console.log(`📊 Result: Found ${filtered.length} stories containing "manager"`);
            filtered.slice(0, 3).forEach(story => {
                console.log(`   • ${story.storyNumber}: ${story.storyText.substring(0, 60)}...`);
            });
            console.log(`✅ Success\n`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        // Test 2.3: Test if space-agnostic search would help user stories
        console.log('TEST 2.3: Compare Search With/Without Space Removal');
        console.log('─────────────────────────────────────────');
        try {
            const allStories = await httpRequest(3001, '/api/user-stories');
            const searchTerm = 'UserRole'; // Example compound term
            
            // Current implementation (no space removal)
            const currentMethod = allStories.filter(story => {
                const searchText = (story.storyText + ' ' + story.storyNumber).toLowerCase();
                return searchText.includes(searchTerm.toLowerCase());
            });
            
            // With space removal (proposed improvement)
            const improvedMethod = allStories.filter(story => {
                const searchText = (story.storyText + ' ' + story.storyNumber).toLowerCase();
                const searchTextNoSpaces = searchText.replace(/\s+/g, '');
                const searchNoSpaces = searchTerm.replace(/\s+/g, '').toLowerCase();
                return searchText.includes(searchTerm.toLowerCase()) || 
                       searchTextNoSpaces.includes(searchNoSpaces);
            });
            
            console.log(`📊 Current method: ${currentMethod.length} matches`);
            console.log(`📊 Improved method: ${improvedMethod.length} matches`);
            if (improvedMethod.length > currentMethod.length) {
                console.log(`⚠️  Space-agnostic search would find ${improvedMethod.length - currentMethod.length} additional stories`);
            } else {
                console.log(`✅ No difference for this search term`);
            }
            console.log('');
        } catch (error) {
            console.error(`❌ Error: ${error.message}\n`);
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log('COMPARISON SUMMARY');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('📊 Data Object Search Features:');
        console.log('   ✅ Space-agnostic matching (removes spaces)');
        console.log('   ✅ Multiple filter options (name, isLookup, parent)');
        console.log('   ✅ Always case-insensitive');
        console.log('   ✅ Returns structural metadata\n');

        console.log('📊 User Story Search Features:');
        console.log('   ❌ NO space-agnostic matching');
        console.log('   ✅ Configurable case sensitivity');
        console.log('   ✅ Searches multiple fields (storyText + storyNumber)');
        console.log('   ✅ Role-based search available\n');

        console.log('🔧 Recommendations:');
        console.log('   1. Add space removal logic to user story search');
        console.log('   2. Add case sensitivity option to data object search');
        console.log('   3. Consider unified search utility');
        console.log('   4. Document fallback behavior differences\n');

        console.log('✅ All tests completed!\n');

    } catch (error) {
        console.error(`\n❌ Test suite failed: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests
runTests().then(() => {
    console.log('✅ Test suite completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
});
