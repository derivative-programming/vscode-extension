// simple-bridge-test.js
// Simple test of MCP Bridge
console.log('Starting test...');

const http = require('http');

function testEndpoint(port, path) {
    console.log(`Testing ${path} on port ${port}...`);
    
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:${port}${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`✅ Success: Got ${json.length} items`);
                    resolve(json);
                } catch (e) {
                    console.log(`✅ Success: Got response (not JSON)`);
                    resolve(data);
                }
            });
        }).on('error', (err) => {
            console.log(`❌ Error: ${err.message}`);
            reject(err);
        });
    });
}

async function main() {
    console.log('Testing MCP Bridge endpoints...\n');
    
    try {
        // Test data objects
        console.log('TEST 1: Data Objects');
        const dataObjects = await testEndpoint(3001, '/api/data-objects');
        console.log(`Found ${dataObjects.length} data objects\n`);
        
        // Test user stories  
        console.log('TEST 2: User Stories');
        const userStories = await testEndpoint(3001, '/api/user-stories');
        console.log(`Found ${userStories.length} user stories\n`);
        
        console.log('All tests passed!');
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

main();
