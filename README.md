# 🧙‍♂️ ZIP Wizard

An advanced archive management application with intelligent file exploration, AI-powered insights, and a sophisticated navigation system.

[![CI](https://github.com/AUo959/zip_wizard/actions/workflows/ci.yml/badge.svg)](https://github.com/AUo959/zip_wizard/actions/workflows/ci.yml)
[![Code Quality](https://github.com/AUo959/zip_wizard/actions/workflows/code-quality.yml/badge.svg)](https://github.com/AUo959/zip_wizard/actions/workflows/code-quality.yml)

## ✨ Features

### 🗂️ Archive Management
- **Multiple Format Support**: Work with ZIP, TAR, GZ, and other archive formats
- **Smart File Tree**: Hierarchical view with expandable folders
- **Quick Upload**: Drag-and-drop interface for easy archive uploads
- **Archive Comparison**: Side-by-side comparison of multiple archives

### 🤖 AI-Powered Tools
- **Intelligent Insights**: AI-generated summaries and recommendations
- **Smart Clustering**: Automatic file organization based on content
- **Pattern Recognition**: Identify common patterns and structures
- **Code Analysis**: Metrics and quality analysis for source code files

### 🎯 Enhanced Navigation
- **Keyboard Shortcuts**: Press 1-9 to jump between views instantly
- **Arrow Navigation**: Use arrow keys to navigate between tabs
- **Quick Access**: Home/End keys to jump to first/last view
- **Badge System**: NEW, BETA, and dynamic count indicators
- **Grouped Views**: Organized by category (Core, Tools, Security, Analysis, Advanced)
- **Mobile Optimized**: Responsive design with dropdown navigation

### 🔒 Security & Privacy
- **Vulnerability Scanner**: Detect security issues in files
- **Privacy Shield**: Data encryption and protection
- **Circuit Breaker**: Automatic error recovery and resilience
- **Security Monitoring**: Real-time threat detection

### 📊 Analytics & Insights
- **Usage Analytics**: Track file access patterns
- **Performance Metrics**: Monitor application performance
- **Code Metrics**: Analyze code quality and complexity
- **Dependency Graphs**: Visualize file and module dependencies

### 🧘 Productivity Features
- **Wu Wei Interface**: Zen-inspired, distraction-free mode
- **Mushin State**: Flow-optimized interface for deep work
- **Cognitive Load Reducer**: Simplified views when needed
- **Incremental Processing**: Handle large files efficiently
- **Memory Compression**: Optimized memory usage for big archives

## 🚀 Quick Start

### Prerequisites

- Node.js 22.x or higher
- npm or yarn
- PostgreSQL database (for persistence)

### Installation

```bash
# Clone the repository
git clone https://github.com/AUo959/zip_wizard.git
cd zip_wizard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set your DATABASE_URL

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🧪 Testing

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

**Test Coverage:**
- 39 tests passing
- Component tests for enhanced navigation
- Hook tests for state management
- Accessibility compliance testing

## 🎨 Development

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run check            # TypeScript type checking
npm run test             # Run tests in watch mode
npm run test:ui          # Interactive test UI
npm run test:coverage    # Coverage report
npm run lint             # Lint code
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run validate         # Full validation (types + format + tests)
npm run db:push          # Push database schema
```

### Project Structure

```
zip_wizard/
├── client/              # Frontend React application
│   └── src/
│       ├── components/  # React components
│       ├── hooks/       # Custom React hooks
│       ├── lib/         # Utilities and helpers
│       ├── pages/       # Page components
│       └── __tests__/   # Test files
├── server/              # Backend Express server
│   ├── routes/          # API routes
│   ├── db.ts           # Database configuration
│   └── storage.ts      # File storage handling
├── shared/              # Shared types and schemas
│   ├── schema.ts       # Database schemas
│   ├── types.ts        # TypeScript types
│   └── views.ts        # View definitions
├── docs/                # Documentation
└── .github/
    └── workflows/       # CI/CD workflows
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1-9` | Jump to view 1-9 |
| `←` `→` | Navigate between tabs |
| `Home` | Jump to first tab |
| `End` | Jump to last tab |
| `Esc` | Close dialogs/dropdowns |

## 📚 Documentation

- [Enhanced Navigation](docs/ENHANCED-NAVIGATION.md) - Navigation system documentation
- [Navigation Integration](docs/NAVIGATION-IMPLEMENTATION-SUMMARY.md) - Implementation guide
- [Testing Guide](docs/NAVIGATION-TESTING-GUIDE.md) - Testing documentation
- [Testing Infrastructure](docs/TESTING-INFRASTRUCTURE.md) - Test setup and configuration
- [Architecture](ARCHITECTURE.md) - System architecture overview

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons

### Backend
- **Express** - Web server
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **tsx** - TypeScript execution

### Testing
- **Vitest** - Test framework
- **Testing Library** - React component testing
- **jsdom** - DOM testing environment

### Code Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

### CI/CD
- **GitHub Actions** - Automated testing and deployment
- **Codecov** - Code coverage tracking
- **Trivy** - Security scanning

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or changes
- `refactor:` - Code refactoring
- `style:` - Code style changes (formatting, etc.)
- `chore:` - Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by Zen philosophy for productivity features
- Community-driven development

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/AUo959/zip_wizard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AUo959/zip_wizard/discussions)

---

**Made with ❤️ by the ZIP Wizard team**
