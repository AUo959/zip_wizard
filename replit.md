# Code Archive Analyzer

## Overview

This is a full-stack web application that allows users to upload code archives (ZIP files) and provides intelligent code analysis and exploration features. The application extracts files from uploaded archives, analyzes the code using NLP-like techniques, and presents the results through an interactive file browser with syntax highlighting and metadata analysis.

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

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **File Processing**: Multer for file uploads, JSZip for archive extraction
- **API**: RESTful endpoints for archive and file operations

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL
- **Schema**: Structured tables for archives and files with metadata
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### File Upload and Processing
- Drag-and-drop upload interface using react-dropzone
- Archive extraction and file content analysis
- Automatic language detection and complexity assessment
- Dependency extraction from code files

### Code Analysis Engine
- NLP-like analysis for programming languages
- Automatic tagging and categorization
- Complexity scoring (Low/Medium/High)
- Dependency identification from import statements

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
- **@radix-ui/***: Accessible UI component primitives
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