# AppDNA Model Builder

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/derivative-programming.appdna)](https://marketplace.visualstudio.com/items?itemName=derivative-programming.appdna)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/derivative-programming.appdna)](https://marketplace.visualstudio.com/items?itemName=derivative-programming.appdna)

A professional VS Code extension for building application models and automatically generating source code for multiple platforms and languages.

Transform your development workflow: design your application model once, then generate complete source code for .NET, Python, Web applications, Mobile Apps, AR/VR applications (planned), and more. Pull the generated code into your repositories and accelerate your development process.

## Features

### 🏗️ Model Builder
- **Dynamic UI Generation**: All forms and controls are automatically generated from your JSON structure
- **Real-time Validation**: Instant feedback as you edit with built-in validation
- **Professional Interface**: Clean, VS Code-integrated design with hierarchical tree view navigation

### 📝 Intelligent Model Editing
- **Tree View Navigation**: Navigate your project structure with organized sections:
  - **PROJECT**: Configuration settings, lexicon management, MCP servers (both stdio and HTTP)
  - **DATA OBJECTS**: Business entities with hierarchical organization, filtering, and list views
  - **USER STORIES**: Comprehensive story management with 8 specialized views
  - **PAGES**: Forms and reports for UI design (advanced feature)
  - **FLOWS**: Workflow and flow management including page init, general, DynaFlow workflows (advanced feature)
  - **APIS**: API site management from all namespaces (advanced feature)
  - **ANALYSIS**: Analytics dashboard with 9 analysis tools (advanced feature)
  - **MODEL SERVICES**: AI-powered processing, validation, and code generation services
- **Form-Based Editor**: Edit JSON properties using intuitive, dynamically generated forms
- **Right-Click Context Menus**: Add, edit, and manage items with convenient context menus
- **Advanced Filtering**: Filter objects, reports, and forms independently for focused navigation

### 📱 Page Preview & UI Design
- **Page Preview**: Interactive preview of forms and reports before full implementation
- **Role-Based Filtering**: Filter page previews by user roles and access requirements
- **Form Preview**: See how forms will appear to users with parameter fields and buttons
- **Real-Time Updates**: Preview updates automatically as you modify your model
- **Navigation Integration**: Seamlessly switch between preview and detailed editing

### 📊 Analytics & Analysis Dashboard
- **Comprehensive Metrics**: Project-wide metrics dashboard tracking model complexity and statistics
- **Data Object Analysis**: Storage size requirements, usage tracking, and relationship hierarchy visualization
- **Database Forecasting**: Configurable database growth predictions based on data object sizes and usage patterns
- **User Story Analytics**: Role distribution analysis, user journey mapping, and page distance tracking
- **Page Complexity Analysis**: Detailed page metrics with treemap visualizations showing element distributions
- **QA Forecasting**: Testing schedule and forecast based on user story completion status

### 🔄 Workflow & Flow Management
- **PAGE_INIT Flows**: Manage page initialization workflows for application startup logic
- **GENERAL Flows**: Create and edit custom general workflow definitions for business logic
- **DynaFlow Workflows**: Advanced workflow management with DynaFlow-based conditional workflows
- **Workflow Tasks**: Granular workflow task management for complex business processes
- **Independent Filtering**: Filter each flow type independently with dedicated filter controls

### 🌐 API Site Management
- **Centralized API View**: Browse all API sites from all namespaces in one location
- **API Site Details**: View and manage API site configurations including name, title, description, and version
- **Quick Access**: Direct navigation to API site settings and configurations

### 📋 List & Table Views
- **Page List**: Comprehensive tabular view of all pages with complexity analysis, sorting, and filtering
- **Data Object List**: Detailed data object listing with search and filter capabilities
- **Page Init List**: Overview of all page initialization configurations
- **Workflow List**: DynaFlow workflow overview with status and details
- **General List**: Complete listing of general flow definitions

### ⚡ AI-Powered Code Generation
- **Model Services Integration**: Connect to cloud-based AI services for intelligent processing
- **Model Feature Catalog**: Browse and select from a library of pre-built model features
- **Model AI Processing**: Submit models for AI-assisted enhancement and validation
- **Model Validation**: Automated model validation with improvement suggestions and best practice recommendations
- **Fabrication Blueprint Catalog**: Select from fabrication templates for different application types
- **Model Fabrication**: Generate complete source code for .NET, Python, Web, Mobile, AR/VR (planned) applications
- **Authentication**: Secure login/logout/register functionality for accessing Model Services

### 🔧 Advanced Development Features
- **File Watching**: Automatic detection of external file changes
- **In-Memory Editing**: Changes are made in-memory and saved only when you choose
- **Property Control**: Toggle property existence with checkboxes - unchecked means the property is omitted from JSON
- **Tooltips & Descriptions**: Property descriptions shown as helpful tooltips
- **Visual Diagrams**: Hierarchy diagrams and page flow visualizations
- **MCP Integration**: Model Context Protocol server for external tool integration
- **Keyboard Shortcuts**: Quick access to common actions with Alt+A combinations

## Getting Started

### Quick Start
1. **Install the Extension**: Search for "AppDNA Model Builder" in the VS Code marketplace
2. **Open Your Project**: Open a folder where you want to create your AppDNA model
3. **Follow the Welcome Workflow**: The extension provides a guided 9-step workflow:

### AppDNA Development Workflow
The extension provides a comprehensive workflow for model-driven development:

1. **Create New Project Model** - Start with a new AppDNA JSON model file
2. **Update Project Settings** - Configure project metadata and context information  
3. **Register/Login to Model Services** - Access AI-powered cloud services
4. **Add Model Features** - Browse and select features from the feature catalog
5. **Request Model AI Processing** - Enhance your model with AI assistance
6. **Request Model Validation** - Validate and improve your model structure
7. **Select Fabrication Blueprints** - Choose templates for code generation
8. **Request Model Fabrication** - Generate source code for multiple platforms
9. **Manual Model Editing** - Fine-tune your model and iterate

### Quick Actions
## Keyboard Shortcuts

All shortcuts use the simple `Alt+A [key]` format to avoid conflicts with standard VS Code shortcuts:

### File Operations
- `Alt+A N` - Create new AppDNA model file
- `Alt+A S` - Save model to file

### Add Items
- `Alt+A O` - Add new data object
- `Alt+A R` - Add new report
- `Alt+A F` - Add new form

### View Controls
- `Alt+A E` - Expand all top level items
- `Alt+A C` - Collapse all top level items
- `Alt+A T` - Refresh view (re**T**resh)
- `Alt+A I` - Show filter (f**I**lter)
- `Alt+A X` - Clear filter (clear = **X**)

### Diagrams & Views
- `Alt+A H` - Show hierarchy diagram
- `Alt+A P` - Show page flow diagram
- `Alt+A V` - Show page preview

### Settings & Help
- `Alt+A G` - Show AppDNA settings (confi**G**)
- `Alt+A W` - Show welcome screen
- `Alt+A Q` - Show help (**Q**uestion)
- **Welcome View** - Access the guided workflow anytime
- **Tree View** - Navigate and manage your model structure

## Extension Interface

![AppDNA Extension Overview](https://raw.githubusercontent.com/derivative-programming/vscode-extension/main/media/screenshot.png)

### Page Preview Feature

![Page Preview Interface](https://raw.githubusercontent.com/derivative-programming/vscode-extension/main/media/page-preview-screenshot.png)

### Page Flow Diagrams

![Page Flow Flowchart View](https://raw.githubusercontent.com/derivative-programming/vscode-extension/main/media/page-flow-flowchart-screenshot.png)

![Page Flow Graph View](https://raw.githubusercontent.com/derivative-programming/vscode-extension/main/media/page-flow-graph-screenshot.png)

### User Stories Management

![User Stories Interface](https://raw.githubusercontent.com/derivative-programming/vscode-extension/main/media/userstories-screenshot.png)

User Stories has evolved into its own dedicated section with comprehensive management capabilities across multiple specialized views:

#### User Stories Views

- **Roles**: Direct access to the Role data object with lookup items. Manage and configure all user roles for your application.

- **Role Requirements**: Manage role requirements and permissions for data objects. Define what roles can access which data objects and configure security constraints for your application.

- **Stories**: Create and manage user stories with proper formatting and validation. Add, edit, and organize user stories that define your application's functionality.

- **Development**: Track development progress, story points, developer assignments, and sprint planning. Monitor the implementation status of each user story.

- **Page Mapping**: Map user stories to specific pages and requirements. Visualize which pages fulfill each user story and ensure comprehensive coverage of your application's functionality.

- **User Journey**: Track and visualize the user journey showing which pages fulfill each story. Follow the flow of user interactions across your application with navigation pattern analysis.

- **Requirements Fulfillment**: Monitor required and restricted role requirements across user stories. Ensure that role-based access controls are properly implemented and validated.

- **QA**: Track quality assurance status of user stories. Monitor testing progress, validation status, completion metrics, and QA forecasting for your user stories.

### Tree View (Sidebar)
- **PROJECT**: Configuration settings, lexicon management, MCP servers (both stdio and HTTP)
- **DATA OBJECTS**: Business entities with hierarchical organization, filtering, and list views
- **USER STORIES**: Comprehensive story management with 8 specialized views (see User Stories Management above)
- **PAGES**: Forms and reports for user interface design (advanced feature)
- **FLOWS**: Workflow and flow management including PAGE_INIT, GENERAL, WORKFLOWS, and WORKFLOW_TASKS (advanced feature)
- **APIS**: API site management from all namespaces with quick access to configurations (advanced feature)
- **ANALYSIS**: Analytics dashboard with 9 analysis tools including metrics, forecasting, and visualizations (advanced feature)
- **MODEL SERVICES**: AI-powered processing, validation, and code generation services with authentication

### Detail Panels
- **Dynamic Forms**: Property editors generated from JSON structure
- **Tabbed Interface**: Organized editing for complex objects (Settings, Parameters, Buttons, etc.)
- **Property Toggles**: Checkbox controls to include/exclude properties from JSON output
- **Validation Feedback**: Real-time validation with helpful error messages

### Additional Views
- **Welcome View**: Guided workflow with 9 development steps
- **Page Preview View**: Interactive preview of forms and reports with role-based filtering
- **Help View**: Documentation links and support resources
- **Settings View**: Extension configuration and preferences
- **Command Palette**: Access all extension features via `Ctrl+Shift+P`

### Visual Tools
- **Hierarchy Diagrams**: Visualize object relationships and dependencies
- **Page Flow Diagrams**: Map user interface navigation and workflows
- **Page Preview**: Interactive preview of forms and reports with role-based filtering
- **Search & Filter**: Find and organize models efficiently across all object types

A Windows app version of this extension is available [here](https://github.com/derivative-programming/ModelWinApp).

## Page Preview Feature

The Page Preview feature provides an interactive way to preview your forms and reports before full implementation, helping you visualize the user experience during the design phase.

### Key Features
- **Role-Based Filtering**: Filter pages by user roles to see what different user types can access
- **Interactive Form Preview**: See how forms will appear with parameter fields, buttons, and layout
- **Real-Time Updates**: Preview updates automatically when you modify your model
- **Navigation Integration**: Switch seamlessly between preview and detailed form/report editing
- **Professional Styling**: Preview uses VS Code theme for consistent, professional appearance

### How to Use
1. **Access the Preview**: Click the eye icon next to "PAGES" in the tree view, or use `Alt+A V`
2. **Filter by Role**: Use checkboxes to filter pages by required user roles
3. **Select a Page**: Choose from the dropdown of available forms and reports
4. **Preview Content**: View the page layout, fields, and available actions
5. **Open Details**: Click "View Full Page Details" to open the complete form/report editor

### Requirements
- Enable "Show Advanced Properties" in AppDNA settings to see the PAGES section
- Forms and reports must have `isPage="true"` property to appear in preview
- Role requirements are determined by `roleRequired` property on forms/reports

The Page Preview feature is particularly useful for:
- **UI/UX Design**: Visualizing user interfaces before implementation
- **Role Planning**: Understanding access patterns and user workflows
- **Client Demos**: Showing stakeholders how the application will look and function
- **Development Planning**: Identifying form requirements and user interactions

## Analytics & Analysis Dashboard

The ANALYSIS section provides comprehensive analytics and forecasting tools to help you understand your application model's complexity, structure, and growth patterns. Access these tools from the ANALYSIS tree section (requires "Show Advanced Properties" setting enabled).

### Available Analysis Tools

#### Metrics Analysis
View project-wide metrics and statistics including:
- Total count of data objects, pages, forms, reports, and workflows
- Property and relationship counts across the model
- Complexity metrics and model structure insights
- Historical metric tracking with trend visualization

#### Data Object Analysis
- **Data Object Hierarchy**: Interactive diagram showing parent-child relationships between data objects with visual hierarchy representation
- **Data Object Size**: Calculate storage requirements for each data object based on property types (int, string, datetime, etc.) with detailed breakdowns
- **Data Object Usage**: Comprehensive cross-reference analysis showing where each data object is used across forms, reports, flows, and other components

#### Forecasting Tools
- **Database Size Forecast**: Configure expected record counts and growth rates for each data object, then predict total database storage requirements over time with detailed projections
- **QA Forecast**: View testing schedule and forecast based on user story completion status, test case counts, and QA resource allocation

#### User Story Analytics
- **User Stories Role Distribution**: Analyze how roles are distributed across user stories with charts showing role usage patterns
- **User Story Journey**: Visualize user journeys through the application with page distance analysis and navigation pattern tracking

#### Page Analysis
- **Page Complexity**: Detailed page metrics showing element counts (fields, buttons, parameters) with treemap visualizations displaying complexity distributions across all pages

### How to Access
- Expand the ANALYSIS section in the tree view
- Click on any analysis tool to open its interactive view
- Most tools include charts, graphs, and exportable data
- Analysis results update automatically when your model changes

## Workflow & Flow Management

The FLOWS section provides comprehensive workflow and business logic management capabilities. Access this section from the FLOWS tree item (requires "Show Advanced Properties" setting enabled).

### Flow Types

#### PAGE_INIT Flows
Page initialization workflows that execute when pages load:
- Configure startup logic for forms and reports
- Set initial parameter values and state
- Define data loading and validation logic
- Manage page-level security and access control
- Use the Page Init List for tabular overview with filtering

#### GENERAL Flows
Custom general workflow definitions for business logic:
- Create reusable workflow patterns
- Define multi-step business processes
- Configure conditional logic and branching
- Add new general flows with `Alt+A` + general flow command
- Use the General List for comprehensive flow overview

#### WORKFLOWS (DynaFlow-based)
Advanced workflow management for dynamic business processes:
- Conditional feature requiring DynaFlow data object in your model
- Define complex, stateful workflows with multiple stages
- Configure workflow transitions and validations
- Track workflow execution and history
- Use the Workflow List for workflow overview and management

#### WORKFLOW_TASKS (DynaFlowTask-based)
Granular workflow task management:
- Conditional feature requiring both DynaFlow and DynaFlowTask data objects
- Break workflows into individual tasks
- Assign and track task completion
- Configure task dependencies and sequencing
- Monitor task execution status

### Flow Management Features
- **Independent Filtering**: Each flow type has dedicated filter controls for focused navigation
- **List Views**: Tabular views available for Page Init, General, and Workflows
- **Right-Click Menus**: Quick access to add, edit, and manage flows
- **Visual Indicators**: Icons and status indicators show flow types and states
- **Search & Filter**: Find flows quickly with built-in search and filter capabilities

## API Site Management

The APIS section provides centralized management of API sites across all namespaces in your model. Access this section from the APIS tree item (requires "Show Advanced Properties" setting enabled).

### Features
- **Centralized View**: Browse all API sites from all namespaces in one location
- **API Site Details**: View comprehensive information including:
  - API site name and title
  - Description and purpose
  - Version number
  - Configuration settings
- **Quick Access**: Click any API site to open its configuration details
- **Alphabetical Sorting**: API sites are automatically sorted alphabetically for easy navigation
- **Cross-Namespace Support**: See API sites from all namespaces without navigating through individual namespace trees

### How to Use
1. Expand the APIS section in the tree view
2. Browse the list of available API sites
3. Click on any API site to view or edit its configuration
4. Hover over an API site to see its tooltip with full details

## List & Table Views

The extension provides comprehensive list and table views for various model elements, offering alternative ways to view and manage your model data beyond the tree view.

### Available List Views

#### Page List
Comprehensive tabular view of all pages (forms and reports):
- **Complexity Analysis**: View element counts for each page (fields, buttons, parameters)
- **Sorting**: Sort by name, complexity, type, or other attributes
- **Filtering**: Filter pages by type, role requirements, or other criteria
- **Treemap Visualization**: Visual representation of page complexity distribution
- **Quick Navigation**: Click any page to open its detailed editor
- Access via the table icon next to PAGES in the tree view

#### Data Object List
Detailed listing of all data objects:
- **Comprehensive View**: See all data objects in a sortable, filterable table
- **Property Counts**: View property and relationship counts for each object
- **Search**: Quick search across object names and descriptions
- **Parent-Child Display**: See object hierarchy relationships
- Access via the table icon next to DATA OBJECTS in the tree view

#### Page Init List
Overview of all page initialization configurations:
- **Tabular Format**: View all page init flows in a structured table
- **Flow Details**: See configuration details for each page init flow
- **Filtering**: Filter by page or flow characteristics
- Access via the table icon next to PAGE_INIT in the FLOWS section

#### Workflow List
DynaFlow workflow overview:
- **Workflow Status**: View status and configuration of all workflows
- **Details View**: See workflow stages, transitions, and logic
- **Management**: Edit and manage workflows from the list view
- Access via the table icon next to WORKFLOWS in the FLOWS section

#### General List
Complete listing of general flow definitions:
- **Flow Overview**: View all general flows in a structured format
- **Configuration Details**: See flow names, descriptions, and configurations
- **Quick Access**: Jump to flow editors directly from the list
- Access via the table icon next to GENERAL in the FLOWS section

### List View Benefits
- **Alternative Navigation**: Different perspective on model structure beyond tree view
- **Bulk Operations**: Easier to compare and analyze multiple items simultaneously
- **Data Export**: Many list views support data export for reporting
- **Quick Search**: Find items faster with built-in search and filter capabilities

## Model Context Protocol (MCP) Integration

The extension includes built-in MCP server capabilities for seamless integration with AI assistants and external tools:

### MCP Server Features
- **Local MCP Server**: Starts/stops a local MCP server for direct integration
- **HTTP Server Bridge**: Provides HTTP access to MCP functionality for web-based tools
- **Real-time Status**: Visual indicators show server running/stopped states in the tree view
- **Tool Integration**: Exposes AppDNA model operations as MCP tools for AI assistants

### Server Management
- Start/stop servers directly from the PROJECT section in the tree view
- Automatic port management and conflict resolution
- Status monitoring with visual feedback
- Configurable server settings through AppDNA configuration

## Requirements

- Visual Studio Code 1.99.0 or higher

## Extension Settings

This extension provides comprehensive configuration through both VS Code settings and AppDNA-specific configuration:

### VS Code Settings
- `appDNA.modelServiceUrl`: Configure the URL for external Model Services API (default: https://modelservicesapi.derivative-programming.com)

### AppDNA Configuration (app-dna.config.json)
The extension creates and manages an `app-dna.config.json` file in your workspace with these configurable options:

- **Output Path**: Directory where generated code files will be saved (relative to workspace root)
- **Show Advanced Properties**: Controls visibility of advanced tree view items (Lexicon, User Stories, MCP Servers, Pages)
- **Expand Nodes on Load**: Automatically expands all tree view sections when a model is loaded
- **Model File Name**: Specify custom name for your AppDNA model file (default: app-dna.json)

### Configuration Access
- **Settings Gear Icon**: Click the gear icon in the AppDNA tree view title bar
- **AppDNA Settings View**: User-friendly interface for editing configuration properties
- **Automatic Configuration**: Extension creates default configuration on first use

## Known Issues

- MCP is a work in progress

Please report issues on our [GitHub repository](https://github.com/derivative-programming/vscode-extension/issues).

## Release Notes

### 1.0.0

Initial release of AppDNA Model Builder featuring:
- Dynamic UI generation
- Real-time model editing and validation
- Professional tree view and form-based editing interface
- Code generation capabilities

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/derivative-programming/vscode-extension/blob/main/CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report Issues](https://github.com/derivative-programming/vscode-extension/issues)
- 💬 [Discussions](https://github.com/derivative-programming/vscode-extension/discussions)

---

**Enjoy building with AppDNA! 🚀**
