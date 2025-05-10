/**
 * lexiconView.test.ts
 * Tests for the lexicon view functionality
 * Created: May 9, 2025
 */

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { ModelService } from '../services/modelService';
import { RootModel } from '../data/models/rootModel';
import { LexiconItemModel } from '../data/models/lexiconItemModel';

suite('Lexicon View Tests', () => {
    
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
        
        testFilePath = path.join(testDataDir, 'test-lexicon.json');
        
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
                                internalTextValue: "Welcome",
                                displayTextValue: "Welcome to AppDNA"
                            },
                            { 
                                name: "LexiconItem2",
                                internalTextValue: "Dashboard",
                                displayTextValue: "Main Dashboard"
                            },
                            { 
                                name: "LexiconItem3",
                                internalTextValue: "Settings",
                                displayTextValue: "Application Settings"
                            }
                        ]
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
    
    test('Lexicon items are accessible from the first namespace', () => {
        // Get the current model
        const rootModel = modelService.getCurrentModel();
        
        // Verify model exists
        assert.notStrictEqual(rootModel, null, 'Root model should not be null');
        
        if (rootModel) {
            // Verify namespace array exists
            assert.notStrictEqual(rootModel.namespace, undefined, 'Namespace array should not be undefined');
            assert.strictEqual(rootModel.namespace!.length > 0, true, 'Namespace array should not be empty');
            
            // Get first namespace
            const firstNamespace = rootModel.namespace![0];
            
            // Verify lexicon array exists
            assert.notStrictEqual(firstNamespace.lexicon, undefined, 'Lexicon array should not be undefined');
            assert.strictEqual(firstNamespace.lexicon!.length, 3, 'Lexicon array should have 3 items');
            
            // Verify lexicon items have correct properties
            assert.strictEqual(firstNamespace.lexicon![0].internalTextValue, 'Welcome', 'First lexicon item should have correct internal text');
            assert.strictEqual(firstNamespace.lexicon![0].displayTextValue, 'Welcome to AppDNA', 'First lexicon item should have correct display text');
        }
    });
    
    test('Lexicon items can be updated', () => {
        // Get the current model
        const rootModel = modelService.getCurrentModel();
        assert.notStrictEqual(rootModel, null, 'Root model should not be null');
        
        if (rootModel && rootModel.namespace && rootModel.namespace.length > 0) {
            // Get first namespace
            const namespace = rootModel.namespace[0];
            assert.notStrictEqual(namespace.lexicon, undefined, 'Lexicon array should not be undefined');
            
            if (namespace.lexicon) {
                // Update a lexicon item
                const updatedText = 'Updated Display Text';
                namespace.lexicon[1].displayTextValue = updatedText;
                
                // Verify the update worked
                assert.strictEqual(namespace.lexicon[1].displayTextValue, updatedText, 'Lexicon item should be updated');
            }
        }
    });
});
