# ZIP Wizard v2.2.6b - Universal File Processing Wizard

## Overview

This is a quantum-inspired full-stack web application that provides comprehensive file processing capabilities for ANY file type - not just ZIP archives. The application handles documents, images, videos, code files, databases, and more with intelligent parsing and analysis. It features advanced observer logic, symbolic threading, circuit breaker protection, and presents results through an interactive file browser with syntax highlighting, metadata analysis, and a comprehensive status dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React with TypeScript
- **Bundler**: Vite for development and build
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with custom styling
- **Configuration**: Centralized config system for cross-platform compatibility

### Backend Architecture

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **File Processing**: Multer for file uploads, JSZip for archive extraction
- **API**: RESTful v1 API with versioning and CORS support
- **Cross-Platform**: Configurable CORS, API versioning, health checks

### Data Storage Solutions

- **Database**: PostgreSQL with Drizzle ORM (persistent storage)
- **Connection**: Neon Database serverless PostgreSQL
- **Schema**: Structured tables for archives and files with metadata
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Universal File Upload and Processing

- Drag-and-drop upload interface accepting ALL file types
- Comprehensive file parser system with extensible architecture
- Support for archives (ZIP, TAR, RAR, 7Z, GZ)
- Document parsing (PDF, DOCX, XLSX, PPTX, ODT)
- Image processing with metadata extraction (JPG, PNG, GIF, SVG, PSD)
- Video/Audio analysis with duration and codec detection
- Code file analysis with language detection and complexity scoring
- Database file recognition (SQLite, CSV)
- Binary file handling (EXE, DLL, WASM)
- Circuit breaker protection for reliable uploads
- Hash-based mutation tracking for file integrity

### Code Analysis Engine

- NLP-like analysis for programming languages
- Automatic tagging and categorization
- Complexity scoring (Low/Medium/High)
- Dependency identification from import statements

### Observer Service (v2.2.6b Enhancement)

- Real-time event tracking (upload, analysis, mutation, export, access)
- Activity summaries with severity levels
- Monitoring window support (default 48 hours)
- Critical event alerts and filtering

### Quantum-Inspired Status Dashboard

- Symbolic threading visualization (T1_CHAIN format)
- Ethics lock and trust anchor display
- Deployment status tracking
- Replay state management
- Activity monitoring with event distribution charts
- Purple/blue gradient quantum-inspired UI design

### File Explorer

- Hierarchical tree view of uploaded archives
- Search and filtering capabilities
- Real-time file selection and preview
- Tab-based file viewing system

### Code Viewer

- Syntax highlighting for multiple languages
- File metadata display (size, language, complexity)
- Copy and export functionality
- Analysis panel with detailed code insights
- Mutation tracking display

### Security & Trust Features (v2.2.6b)

- **Ethics Lock**: Configurable ethical boundaries (default: Picard_Delta_3)
- **Trust Anchor**: Security verification system (default: SN1-AS3-TRUSTED)
- **Symbolic Chain**: Traceable operation history
- **Thread Tags**: Unique identifiers for operation sequences

### Cross-Platform Integration Features

- **RESTful API v1**: Versioned API endpoints for stability
- **CORS Support**: Configurable cross-origin resource sharing
- **Health Monitoring**: `/api/health` endpoint for system status
- **API Documentation**: `/api/v1/docs` endpoint with complete API specs
- **Export Capabilities**: JSON export of archive analysis
- **Query Filtering**: Language, tag, complexity filters on file endpoints
- **Consistent Response Format**: Standardized success/error responses
- **Observer Events API**: `/api/v1/observer/events` for event tracking
- **Status Dashboard API**: `/api/v1/archives/:id/status` for quantum status
- **Mutations API**: `/api/v1/mutations` for tracking file changes

## Data Flow

1. **Upload**: User drags/drops ZIP file to upload zone
2. **Processing**: Server extracts archive using JSZip
3. **Analysis**: Each file is analyzed for language, complexity, and dependencies
4. **Storage**: Archive metadata and file contents stored in PostgreSQL
5. **Retrieval**: Client fetches archive list and file contents via REST API
6. **Display**: React components render file tree and code viewer

## External Dependencies

### Frontend Dependencies

- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/\***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router
- **react-dropzone**: File upload interface

### Backend Dependencies

- **express**: Web application framework
- **drizzle-orm**: Type-safe ORM for PostgreSQL
- **@neondatabase/serverless**: Neon database driver
- **multer**: Multipart form data handling
- **jszip**: ZIP file processing

### Development Tools

- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database migration tool
- **esbuild**: Server-side bundling

## Deployment Strategy

### Development

- Vite dev server for frontend with HMR
- tsx for TypeScript execution in development
- Environment variable configuration for database

### Production Build

- Vite builds frontend to `dist/public`
- esbuild bundles server code to `dist/index.js`
- Single Node.js process serves both static files and API

### Database Management

- Drizzle migrations for schema updates
- Environment-based configuration
- PostgreSQL connection via DATABASE_URL

### Platform Integration

- Replit-specific configurations and plugins
- Development banner and cartographer integration
- Runtime error overlay for debugging

The application follows a clean separation of concerns with shared types between frontend and backend, enabling type-safe development across the full stack. The architecture supports real-time file analysis and provides an intuitive interface for exploring code archives.

## Recent Changes

### January 2, 2025 - Major Performance & Analysis Enhancements

- **Incremental Archive Processing**: Chunked processing for large archives with pause/resume capability
- **Archive Comparison Tool**: Side-by-side archive comparison with detailed change tracking
- **Vulnerability Scanner**: OWASP-compliant security scanning with CVE detection
- **Dependency Graph Visualization**: Interactive force-directed graph with circular dependency detection
- **Code Metrics & Complexity Analysis**: Comprehensive code quality metrics including cyclomatic/cognitive complexity, Halstead metrics, maintainability index, technical debt calculation, code smell detection, and duplication analysis
- **Intelligent Timing Optimizer**: AI-powered request sequencing with adaptive scaling, circuit breakers, exponential backoff, priority queuing, resource pooling, and automatic timeout prevention
- **Advanced Circuit Breaker System**: Emergent intelligence with quantum-inspired states, adaptive thresholds, predictive failure detection, self-healing mechanisms, and native integration with file upload operations
- **Performance Improvements**: Background processing, concurrent chunk handling, memory optimization
- **Security Analysis**: Pattern-based vulnerability detection, hardcoded secrets scanner, weak crypto detection
- **Advanced Visualizations**: Zoomable graphs, cluster analysis, orphan file detection, hub file identification

### August 1, 2025 - Universal File Processing & Circuit Breaker Integration

- **Universal File Parser System**: Comprehensive handling of ALL file types, not just ZIP archives
- **Extensible Parser Architecture**: Plugin-based system supporting 30+ file formats out of the box
- **Circuit Breaker Native Integration**: Quantum-inspired protection built directly into upload operations
- **Smart File Detection**: Automatic MIME type and extension-based file type recognition
- **Document Intelligence**: Extract text and metadata from PDFs, Office documents, and more
- **Media Analysis**: Video/audio duration, codec detection, image dimensions and EXIF data
- **Binary File Support**: Handle executables, libraries, and WebAssembly modules safely
- **Fallback Parser**: Intelligent handling of unknown file types with binary detection
- **Enhanced Feature Suite**: Maintained all previous features - symbolic interface, privacy shield, multilingual support, archive manager, dream mode interface

### July 31, 2025 - Redundant Upload Cleanup

- **Issue Resolved**: Frontend timeout causing misleading "failed upload" messages while backend processing succeeded
- **Action Taken**: Cleaned up 6 duplicate uploads using direct SQL deletion (378 observer events, 517 files, 6 archives)
- **Technical Enhancement**: Improved DELETE API cascade deletion and error handling for future maintenance
- **Current State**: Single clean archive with 111 files ready for analysis, all quantum features operational
- **Database Status**: Proper foreign key constraint handling implemented for reliable data cleanup
- **Interface**: Light-themed modern design with excellent readability and vibrant color coding
- **Color System**: 7 distinct accent colors with file type indicators and complexity mapping
- **Testing Status**: Complete validation passed - all buttons functional, export working (37KB), API health confirmed
