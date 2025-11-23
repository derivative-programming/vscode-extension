// server.ts
// MCP Server implementation for AppDNA user stories and views
// Created on: October 12, 2025
// Last modified: October 15, 2025
// This file implements an MCP server that provides user story tools and view opening commands

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { UserStoryTools } from './tools/userStoryTools';
import { ViewTools } from './tools/viewTools';
import { DataObjectTools } from './tools/dataObjectTools';
import { FormTools } from './tools/formTools';
import { GeneralFlowTools } from './tools/generalFlowTools';
import { ReportTools } from './tools/reportTools';
import { ModelTools } from './tools/modelTools';
import { ModelServiceTools } from './tools/modelServiceTools';
import { PageInitTools } from './tools/pageInitTools';
import { WorkflowTools } from './tools/workflowTools';

// Import registration functions
import { registerUserStoryTools } from './tools/registrations/registerUserStoryTools';
import { registerDataObjectTools } from './tools/registrations/registerDataObjectTools';
import { registerFormTools } from './tools/registrations/registerFormTools';
import { registerGeneralFlowTools } from './tools/registrations/registerGeneralFlowTools';
import { registerReportTools } from './tools/registrations/registerReportTools';
import { registerPageInitTools } from './tools/registrations/registerPageInitTools';
import { registerWorkflowTools } from './tools/registrations/registerWorkflowTools';
import { registerModelTools } from './tools/registrations/registerModelTools';
import { registerModelServiceTools } from './tools/registrations/registerModelServiceTools';
import { registerViewTools } from './tools/registrations/registerViewTools';

/**
 * Main MCP Server class
 */
export class MCPServer {
    private static instance: MCPServer;
    private server: McpServer;
    private userStoryTools: UserStoryTools;
    private viewTools: ViewTools;
    private dataObjectTools: DataObjectTools;
    private formTools: FormTools;
    private generalFlowTools: GeneralFlowTools;
    private reportTools: ReportTools;
    private modelTools: ModelTools;
    private modelServiceTools: ModelServiceTools;
    private pageInitTools: PageInitTools;
    private workflowTools: WorkflowTools;
    private transport: StdioServerTransport;

    private constructor() {
        // Initialize UserStoryTools with null modelService (will use in-memory storage)
        this.userStoryTools = new UserStoryTools(null);
        this.viewTools = new ViewTools();
        this.dataObjectTools = new DataObjectTools(null);
        this.formTools = new FormTools(null);
        this.generalFlowTools = new GeneralFlowTools(null);
        this.reportTools = new ReportTools(null);
        this.modelTools = new ModelTools();
        this.modelServiceTools = new ModelServiceTools();
        this.pageInitTools = new PageInitTools(null);
        this.workflowTools = new WorkflowTools(null);

        // Create MCP server
        this.server = new McpServer({
            name: 'appdna-extension',
            version: '1.0.0',
        });

        // Register tools
        this.registerTools();

        // Create stdio transport
        this.transport = new StdioServerTransport();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): MCPServer {
        if (!MCPServer.instance) {
            MCPServer.instance = new MCPServer();
        }
        return MCPServer.instance;
    }

    /**
     * Register MCP tools
     * 
     * Tools are organized by category (matching MCP-TOOLS-BY-FILE.md order):
     * 1. Data Object Tools (19 tools)
     * 2. Form Tools (14 tools)
     * 3. General Flow Tools (10 tools)
     * 4. Model Service Tools (19 tools)
     * 5. Model Tools (4 tools)
     * 6. Page Init Tools (6 tools)
     * 7. Report Tools (14 tools)
     * 8. User Story Tools (5 tools)
     * 9. View Tools (50 tools)
     * 10. Workflow Tools (7 tools)
     * 
     * Total: 148 tools
     */
    private registerTools(): void {
        // Register User Story Tools (5 tools)
        registerUserStoryTools(this.server, this.userStoryTools);
        
        // Register Data Object Tools (19 tools)
        registerDataObjectTools(this.server, this.dataObjectTools);
        
        // Register Form Tools (14 tools)
        registerFormTools(this.server, this.formTools);
        
        // Register General Flow Tools (10 tools)
        registerGeneralFlowTools(this.server, this.generalFlowTools);
        
        // Register Report Tools (14 tools)
        registerReportTools(this.server, this.reportTools);
        
        // Register Page Init Tools (6 tools)
        registerPageInitTools(this.server, this.pageInitTools);
        
        // Register Workflow Tools (7 tools)
        registerWorkflowTools(this.server, this.workflowTools);
        
        // Register Model Tools (4 tools)
        registerModelTools(this.server, this.modelTools);
        
        // Register Model Service Tools (19 tools)
        registerModelServiceTools(this.server, this.modelServiceTools);
        
        // Register View Tools (50 tools)
        registerViewTools(this.server, this.viewTools);
        
        // All 148 tools are now registered through the functions called above
    }

    /**
     * Start the MCP server
     */
    public async start(): Promise<void> {
        console.error('Starting AppDNA MCP Server...');
        await this.server.connect(this.transport);
        console.error('AppDNA MCP Server started and connected');
    }

    /**
     * Get the underlying MCP server instance (for direct access if needed)
     */
    public getServer(): McpServer {
        return this.server;
    }

    /**
     * Get the transport instance (for direct access if needed)
     */
    public getTransport(): StdioServerTransport {
        return this.transport;
    }

    /**
     * Stop the MCP server
     */
    public async stop(): Promise<void> {
        console.error('Stopping AppDNA MCP Server...');
        await this.transport.close();
        console.error('AppDNA MCP Server stopped');
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    async function main() {
        const server = MCPServer.getInstance();
        console.error('Starting AppDNA MCP Server...');
        await server.getServer().connect(server.getTransport());
        console.error('AppDNA MCP Server started and connected');
    }

    main().catch((error) => {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    });
}
