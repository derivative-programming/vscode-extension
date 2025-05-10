/**
 * model-access.test.ts
 * Tests to verify model structure and accessibility of key elements
 * Created: May 9, 2025
 */

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { ModelService } from '../services/modelService';
import { RootModel } from '../data/models/rootModel';

suite('Model Access Tests', () => {
    
    let modelService: ModelService;
    let testFilePath: string;

    // Set up before running tests
    setup(async () => {
        // Get model service instance
        modelService = ModelService.getInstance();
        
        // Create a simple test file for testing
        const testDataDir = path.join(__dirname, '../../test/fixtures');
        
        // Ensure the test directory exists
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }
        
        testFilePath = path.join(testDataDir, 'test-model.json');
        
        // Create a test model file with namespaces and lexicon items
        const testModel = {
            root: {
                name: "Test Model",
                databaseName: "TestDatabase",
                namespace: [
                    {
                        name: "TestNamespace1",
                        lexicon: [
                            { 
                                name: "LexiconItem1",
                                internalTextValue: "InternalText1",
                                displayTextValue: "DisplayText1"
                            },
                            { 
                                name: "LexiconItem2",
                                internalTextValue: "InternalText2",
                                displayTextValue: "DisplayText2"
                            }
                        ]
                    },
                    {
                        name: "TestNamespace2"
                    }
                ]
            }
        };
        
        fs.writeFileSync(testFilePath, JSON.stringify(testModel, null, 2), 'utf8');
        
        // Load the test file
        await modelService.loadFile(testFilePath);
    });
    
    // Clean up after tests
    teardown(() => {
        modelService.clearCache();
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });
    
    test('Namespace array is accessible in root model', () => {
        // Get the current model
        const rootModel = modelService.getCurrentModel();
        
        // Verify model exists
        assert.notStrictEqual(rootModel, null, 'Root model should not be null');
        
        if (rootModel) {
            // Verify namespace array exists
            assert.notStrictEqual(rootModel.namespace, undefined, 'Namespace array should not be undefined');
            
            // Verify namespace array has correct length
            assert.strictEqual(rootModel.namespace!.length, 2, 'Namespace array should have 2 items');
            
            // Verify first namespace has correct name
            assert.strictEqual(rootModel.namespace![0].name, 'TestNamespace1', 'First namespace should have correct name');
        }
    });
    
    test('Lexicon array is accessible in namespace model', () => {
        // Get the current model
        const rootModel = modelService.getCurrentModel();
        
        // Verify model exists and has namespaces
        assert.notStrictEqual(rootModel, null, 'Root model should not be null');
        assert.notStrictEqual(rootModel?.namespace, undefined, 'Namespace array should not be undefined');
        
        if (rootModel && rootModel.namespace) {
            // Get the first namespace (which should have lexicon items)
            const namespace = rootModel.namespace[0];
            
            // Verify lexicon array exists
            assert.notStrictEqual(namespace.lexicon, undefined, 'Lexicon array should not be undefined');
            
            // Verify lexicon array has correct length
            assert.strictEqual(namespace.lexicon!.length, 2, 'Lexicon array should have 2 items');
            
            // Verify lexicon items have correct properties
            assert.strictEqual(namespace.lexicon![0].name, 'LexiconItem1', 'First lexicon item should have correct name');
            assert.strictEqual(namespace.lexicon![0].internalTextValue, 'InternalText1', 'First lexicon item should have correct internal text');
            assert.strictEqual(namespace.lexicon![0].displayTextValue, 'DisplayText1', 'First lexicon item should have correct display text');
            
            // Verify second namespace has no lexicon items (it should be undefined or empty)
            const namespace2 = rootModel.namespace[1];
            assert.strictEqual(namespace2.lexicon?.length || 0, 0, 'Second namespace should have no lexicon items');
        }
    });
});
