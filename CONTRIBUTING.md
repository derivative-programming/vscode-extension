# Contributing to AppDNA Model Builder

Thank you for your interest in contributing to the AppDNA Model Builder VS Code extension! We welcome contributions from the community and appreciate your help in making this extension better.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 16 or higher)
- [VS Code](https://code.visualstudio.com/) (version 1.99.0 or higher)
- [Git](https://git-scm.com/)

### Setting Up Your Development Environment

1. **Fork the Repository**
   - Go to https://github.com/derivative-programming/vscode-extension
   - Click the "Fork" button in the top right corner

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/vscode-extension.git
   cd vscode-extension
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Open in VS Code**
   ```bash
   code .
   ```

5. **Start Development**
   - Press `F5` to launch the Extension Development Host
   - This opens a new VS Code window with your extension loaded

## 🔧 Development Workflow

### Project Structure

```
src/
├── extension.ts          # Main extension entry point
├── commands/            # Command implementations
├── services/           # Core services (ModelService, etc.)
├── webviews/          # UI components (JavaScript for webviews)
├── data/              # Data models and interfaces
├── utils/             # Utility functions
└── test/              # Test files
```

### Key Principles

1. **Schema-Driven Development**: All UI is generated dynamically from JSON schema
2. **TypeScript for Logic**: Use TypeScript for all extension logic (`src/` folder)
3. **JavaScript for Webviews**: Use JavaScript for webview code (`src/webviews/`)
4. **Clean Architecture**: Follow the layered architecture pattern
5. **Documentation**: Comment your code thoroughly

### Building and Testing

```bash
# Build the extension
npm run compile

# Watch for changes (recommended during development)
npm run watch

# Run tests
npm test

# Package the extension
npm run package
```

## 📝 Coding Guidelines

### General Rules

- Use **double quotes** for strings in JavaScript
- Prefer regular string concatenation over template literals for short strings
- Add comments explaining complex logic
- Follow existing naming conventions
- Keep files focused and reasonably sized

### TypeScript Guidelines

- Use explicit types where helpful
- Follow existing interface patterns
- Leverage VS Code API types properly
- Handle errors gracefully

### JavaScript Guidelines (Webviews)

- Use vanilla JavaScript (no external frameworks in webviews)
- Follow the existing event-driven pattern
- Ensure proper cleanup of event listeners
- Test in both light and dark VS Code themes

### Schema-Driven UI

- Never hardcode property names or types
- Always iterate over schema to generate UI
- Use schema descriptions for tooltips
- Handle missing properties gracefully

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Extension Version**: Check in VS Code Extensions panel
2. **VS Code Version**: Help → About
3. **Operating System**: Windows/macOS/Linux version
4. **Steps to Reproduce**: Clear, numbered steps
5. **Expected Behavior**: What should happen
6. **Actual Behavior**: What actually happens
7. **Screenshots**: If relevant
8. **Error Messages**: From VS Code Output panel or Developer Tools

### Bug Report Template

```markdown
**Extension Version**: 1.0.0
**VS Code Version**: 1.99.0
**OS**: Windows 11

**Steps to Reproduce**:
1. Open AppDNA extension
2. Click on...
3. See error

**Expected**: Should show...
**Actual**: Shows error...
**Screenshots**: [Attach if relevant]
```

## ✨ Feature Requests

We welcome feature suggestions! Please:

1. Check existing issues to avoid duplicates
2. Describe the problem you're trying to solve
3. Explain your proposed solution
4. Consider how it fits with the schema-driven architecture
5. Provide examples or mockups if helpful

## 🔄 Pull Request Process

### Before Submitting

1. **Create an Issue**: Discuss major changes first
2. **Fork & Branch**: Create a feature branch from `main`
3. **Follow Guidelines**: Adhere to coding standards
4. **Test Thoroughly**: Ensure your changes work
5. **Update Documentation**: Update README if needed

### Pull Request Template

When submitting a PR, please include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested in Extension Development Host
- [ ] Works with sample AppDNA models
- [ ] No console errors
- [ ] Follows schema-driven patterns

## Screenshots
[If UI changes]

## Checklist
- [ ] Code follows project guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**: Ensure builds pass
2. **Code Review**: @vroche will review all PRs
3. **Testing**: Manual testing in development environment
4. **Merge**: Only @vroche can merge to main branch

## 📚 Development Resources

### Key Files to Understand

- `src/extension.ts` - Main extension activation
- `src/services/modelService.ts` - Core data management
- `src/webviews/` - UI implementation patterns
- `app-dna.schema.json` - Schema that drives UI generation

### VS Code Extension Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)

### Architecture Notes

- Read `ai-agent-architecture-notes.md` for insights into the codebase
- Check `EXTENSION-DESCRIPTION.md` for detailed architecture overview
- Review existing commands in `src/commands/` for patterns

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions relevant and professional

### Communication

- **Issues**: For bug reports and feature requests
- **Pull Requests**: For code contributions
- **Discussions**: For general questions and ideas

## 🆘 Getting Help

If you need help:

1. **Check Documentation**: README and architecture docs
2. **Search Issues**: Existing solutions might be available
3. **Ask Questions**: Create a discussion or issue
4. **Contact Maintainer**: @vroche for complex architectural questions

## 🎯 Areas for Contribution

We especially welcome contributions in:

- **Bug Fixes**: Stability improvements
- **UI Enhancements**: Better user experience
- **Performance**: Faster loading and processing
- **Documentation**: Clearer guides and examples
- **Testing**: More comprehensive test coverage
- **Accessibility**: Better support for all users

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

**Thank you for contributing to AppDNA Model Builder! 🚀**

Together, we can make schema-driven development more accessible and powerful for everyone.
