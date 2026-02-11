# Contributing to Medly

Thank you for your interest in contributing to Medly! This guide will help you get started with contributing to our AI-Powered Health Intelligence Platform.

## 🚀 Quick Start

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/Medly.git
   cd Medly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Add your API keys to .env.local
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

## 🏗️ Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes

### Code Standards
- **TypeScript**: Strict mode enabled
- **Prettier**: Auto-formatting on save
- **ESLint**: Code quality checks
- **Conventional Commits**: Standardized commit messages

### Commit Message Format
```
type(scope): description

feat(ai): add symptom analysis feature
fix(ui): resolve responsive layout issues
docs(readme): update installation instructions
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or dependency updates

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
src/
├── components/
│   ├── ComponentName.tsx
│   └── ComponentName.test.tsx
├── services/
│   ├── serviceName.ts
│   └── serviceName.test.ts
```

## 📁 Project Structure

```
Medly/
├── components/          # Reusable UI components
├── lib/                # Core libraries and utilities
│   ├── api/           # API integrations
│   ├── chat/          # Chat functionality
│   └── db/            # Database operations
├── pages/             # Page components
├── services/          # Business logic services
├── types.ts           # TypeScript type definitions
├── App.tsx            # Main application component
└── vite.config.ts     # Vite configuration
```

## 🔧 Development Guidelines

### Component Development
- Use functional components with hooks
- Follow TypeScript best practices
- Implement proper error boundaries
- Add accessibility attributes

### API Integration
- Use the existing API structure in `lib/api/`
- Implement proper error handling
- Add loading states and user feedback
- Respect rate limits and handle timeouts

### State Management
- Use React Context for global state
- Keep component state local when possible
- Implement proper state updates and immutability

## 🎨 UI/UX Guidelines

### Design Principles
- **Clarity**: Information should be clear and easy to understand
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive**: Mobile-first design approach
- **Performance**: Optimize for speed and efficiency

### Component Guidelines
- Use semantic HTML elements
- Implement proper ARIA labels
- Test with keyboard navigation
- Ensure color contrast compliance

## 🤝 Pull Request Process

### Before Submitting
1. **Test your changes** thoroughly
2. **Update documentation** if needed
3. **Follow commit message** conventions
4. **Ensure all tests pass**

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] Manual testing completed
- [ ] Accessibility tested

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process
1. **Automated checks** must pass
2. **Code review** by at least one maintainer
3. **Testing** verification
4. **Approval** and merge

## 🐛 Bug Reports

### Reporting Bugs
Use the [GitHub Issues](https://github.com/Iceman-Dann/Medly/issues) page with:

- **Clear title** describing the issue
- **Detailed description** of the problem
- **Steps to reproduce** the issue
- **Expected vs actual** behavior
- **Environment details** (OS, browser, version)
- **Screenshots** if applicable

### Bug Report Template
```markdown
**Bug Description**
Clear and concise description

**To Reproduce**
Steps to reproduce the behavior

**Expected Behavior**
What you expected to happen

**Actual Behavior**
What actually happened

**Screenshots**
If applicable, add screenshots

**Environment:**
- OS: [e.g. Windows 10, macOS 12.0]
- Browser: [e.g. Chrome 91, Firefox 89]
- Version: [e.g. v1.2.3]
```

## 💡 Feature Requests

### Proposing Features
1. **Check existing issues** for duplicates
2. **Use the feature request** template
3. **Provide clear use cases** and benefits
4. **Consider implementation complexity**

### Feature Request Template
```markdown
**Feature Description**
Clear description of the feature

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this work?

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Any other context or screenshots
```

## 📚 Documentation

### Updating Documentation
- **README.md**: Project overview and quick start
- **API docs**: API endpoints and usage
- **Component docs**: Props and usage examples
- **Contributing.md**: This file

### Documentation Style
- Use clear, concise language
- Include code examples
- Add screenshots where helpful
- Keep documentation up-to-date

## 🔐 Security Considerations

### Security Guidelines
- **Never commit** API keys or secrets
- **Use environment variables** for sensitive data
- **Follow HIPAA compliance** for health data
- **Implement proper validation** and sanitization
- **Report security issues** privately

### Security Reporting
For security vulnerabilities, email: security@medly.app

## 🏆 Recognition

### Contributor Recognition
- **Contributors list** in README
- **Release notes** attribution
- **Special recognition** for significant contributions
- **Swag and rewards** for active contributors

### Types of Contributions
- **Code contributions** (features, fixes, tests)
- **Documentation** improvements
- **Bug reports** and feedback
- **Community support** and mentoring
- **Design and UX** improvements

## 📞 Getting Help

### Support Channels
- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Discord Community**: [Join our Discord](https://discord.gg/medly)
- **Email**: support@medly.app

### Resources
- [Documentation](https://docs.medly.app)
- [API Reference](https://api.medly.app)
- [Design System](https://design.medly.app)
- [Blog](https://blog.medly.app)

## 📄 License

By contributing to Medly, you agree that your contributions will be licensed under the same [MIT License](https://opensource.org/licenses/MIT) as the project.

---

Thank you for contributing to Medly and helping transform healthcare communication! 🎉

*Every contribution helps make healthcare more intelligent and accessible for everyone.*
