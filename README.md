# AppDNA Model Builder

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/derivative-programming.appdna)](https://marketplace.visualstudio.com/items?itemName=derivative-programming.appdna)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/derivative-programming.appdna)](https://marketplace.visualstudio.com/items?itemName=derivative-programming.appdna)

A professional VS Code extension for building and managing AppDNA model files with schema-driven UI and code generation capabilities.

## Features

### 🏗️ Schema-Driven Model Builder
- **Dynamic UI Generation**: All forms and controls are automatically generated from your JSON schema
- **Real-time Validation**: Instant feedback as you edit with schema-based validation
- **Professional Interface**: Clean, VS Code-integrated design with tree view navigation

### 📝 Intelligent Editing
- **Tree View Navigation**: Navigate your JSON structure easily in the sidebar
- **Form-Based Editor**: Edit JSON properties using intuitive, dynamically generated forms
- **Right-Click Context Menus**: Add, edit, and manage items with convenient context menus
- **Live JSON Preview**: View the generated JSON in real-time as you make changes

### ⚡ Advanced Features
- **File Watching**: Automatic detection of external file changes
- **In-Memory Editing**: Changes are made in-memory and saved only when you choose
- **Property Control**: Toggle property existence with checkboxes - unchecked means the property is omitted from JSON
- **Tooltips & Descriptions**: Schema descriptions shown as helpful tooltips
- **Keyboard Shortcuts**: Quick access to common actions

## Getting Started

1. **Install the Extension**: Search for "AppDNA Model Builder" in the VS Code marketplace
2. **Open Your Project**: Open a folder containing your AppDNA model files
3. **Start Building**: Use the AppDNA sidebar to create and manage your models
4. **Generate Code**: Use the built-in code generation features

### Quick Actions
- `Ctrl+A O` - Add new object
- `Ctrl+A S` - Save model to file

## Extension Interface

![AppDNA Extension](https://github.com/derivative-programming/vscode-extension/blob/main/media/screenshot.png)

The extension provides:
- **Sidebar Tree View**: Navigate your model structure
- **Detail Panels**: Edit individual objects and properties
- **Command Palette**: Access all extension features via `Ctrl+Shift+P`

## Requirements

- Visual Studio Code 1.99.0 or higher

## Extension Settings

This extension contributes the following settings:

- `appDNA.modelServiceUrl`: Configure the URL for external model generation service (default: https://modelservicesapi.derivative-programming.com)

## Known Issues

- Large model files may take a moment to load initially

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

- 📚 [Documentation](https://github.com/derivative-programming/vscode-extension/wiki)
- 🐛 [Report Issues](https://github.com/derivative-programming/vscode-extension/issues)
- 💬 [Discussions](https://github.com/derivative-programming/vscode-extension/discussions)

---

**Enjoy building with AppDNA! 🚀**
