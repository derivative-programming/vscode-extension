# AppDNA Model Builder

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/derivative-programming.appdna)](https://marketplace.visualstudio.com/items?itemName=derivative-programming.appdna)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/derivative-programming.appdna)](https://marketplace.visualstudio.com/items?itemName=derivative-programming.appdna)

A professional VS Code extension for building application models and automatically generating source code for multiple platforms and languages.

Transform your development workflow: design your application model once, then generate complete source code for .NET, Python, Web applications, Mobile Apps, AR/VR applications (planned), and more. Pull the generated code into your repositories and accelerate your development process.

## Features

### 🏗️ Schema-Driven Model Builder
- **Dynamic UI Generation**: All forms and controls are automatically generated from your JSON schema
- **Real-time Validation**: Instant feedback as you edit with schema-based validation
- **Professional Interface**: Clean, VS Code-integrated design with hierarchical tree view navigation

### 📝 Intelligent Model Editing
- **Tree View Navigation**: Navigate your project structure with organized sections:
  - **PROJECT**: Settings, lexicon, user stories, and MCP server management
  - **DATA OBJECTS**: Schema-based business entities with filtering and search
  - **PAGES**: Forms and reports (when advanced properties are enabled)
  - **MODEL SERVICES**: AI-powered processing and code generation services
- **Form-Based Editor**: Edit JSON properties using intuitive, dynamically generated forms
- **Right-Click Context Menus**: Add, edit, and manage items with convenient context menus
- **Advanced Filtering**: Filter objects, reports, and forms independently for focused navigation

### ⚡ AI-Powered Code Generation
- **Model Services Integration**: Connect to cloud-based AI services for intelligent processing
- **Feature Catalog**: Browse and select from a library of pre-built model features
- **AI Processing**: Submit models for AI-assisted enhancement and validation
- **Multi-Platform Fabrication**: Generate code for .NET, Python, Web, Mobile, AR/VR (planned) applications
- **Blueprint Catalog**: Select from fabrication templates for different application types
- **Validation Services**: Automated model validation with improvement suggestions

### 🔧 Advanced Development Features
- **File Watching**: Automatic detection of external file changes
- **In-Memory Editing**: Changes are made in-memory and saved only when you choose
- **Property Control**: Toggle property existence with checkboxes - unchecked means the property is omitted from JSON
- **Tooltips & Descriptions**: Schema descriptions shown as helpful tooltips
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

### Settings & Help
- `Alt+A G` - Show AppDNA settings (confi**G**)
- `Alt+A W` - Show welcome screen
- `Alt+A Q` - Show help (**Q**uestion)
- **Welcome View** - Access the guided workflow anytime
- **Tree View** - Navigate and manage your model structure

## Extension Interface

![AppDNA Extension](https://github.com/derivative-programming/vscode-extension/blob/main/media/screenshot.png)

The extension provides a comprehensive interface with multiple views:

### Tree View (Sidebar)
- **PROJECT**: Configuration settings, lexicon management, user stories, MCP servers
- **DATA OBJECTS**: Business entities with hierarchical organization and filtering
- **PAGES**: Forms and reports for user interface design (advanced feature)
- **MODEL SERVICES**: AI-powered processing, validation, and code generation services

### Detail Panels
- **Schema-Driven Forms**: Dynamic property editors generated from JSON schema
- **Tabbed Interface**: Organized editing for complex objects (Settings, Parameters, Buttons, etc.)
- **Property Toggles**: Checkbox controls to include/exclude properties from JSON output
- **Validation Feedback**: Real-time schema validation with helpful error messages

### Additional Views
- **Welcome View**: Guided workflow with 9 development steps
- **Help View**: Documentation links and support resources
- **Settings View**: Extension configuration and preferences
- **Command Palette**: Access all extension features via `Ctrl+Shift+P`

### Visual Tools
- **Hierarchy Diagrams**: Visualize object relationships and dependencies
- **Page Flow Diagrams**: Map user interface navigation and workflows
- **Search & Filter**: Find and organize models efficiently across all object types

A Windows app version of this extension is available [here](https://github.com/derivative-programming/ModelWinApp).

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
- Schema-driven dynamic UI generation
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
