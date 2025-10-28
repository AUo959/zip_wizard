# Advanced ArchiveManager Implementation Guide

## Overview

This guide documents the comprehensive ArchiveManager implementation that follows the COPILOT MASTER INSTRUCTION SET requirements. The system provides robust archive management with error recovery, repair capabilities, accessibility features, and extensibility.

## Architecture

### Core Components

#### 1. Type System (`shared/archive-types.ts`)

The foundation of the system is a comprehensive type system:

```typescript
// Core types
Archive           - Main archive definition with metadata, status, errors
FileNode          - Recursive file tree node supporting infinite nesting
ArchiveAction     - Actions: open, export, delete, tag, compare, scan, repair
ArchiveStatus     - Status tracking: idle, loading, processing, error, corrupted, partial
ArchiveError      - Rich error information with recovery actions

// Extension types
ArchiveHandler    - Plugin interface for handling different archive formats
CodeRepairStrategy - Strategies for repairing corrupted code files
HandlerRegistry   - Registry for managing archive handlers
```

#### 2. AdvancedArchiveManager (`client/src/components/advanced-archive-manager.tsx`)

The main component providing:

- Archive listing with search and filtering
- Individual archive cards with health indicators
- Action dropdown menus for each archive
- File tree visualization
- Error display and recovery options
- Selected file details panel
- Responsive layout

**Props:**

```typescript
interface ArchiveManagerProps {
  archives: Archive[]; // List of archives
  onArchiveAction: (id, action, params) => void | Promise<void>;
  selectedArchiveId?: string; // Currently selected archive
  loading?: boolean; // Loading state
  searchQuery?: string; // Search filter
  renderFileTree?: (archive, tree) => React.ReactNode; // Custom tree renderer
  renderArchiveDetails?: (archive) => React.ReactNode; // Custom details
  renderError?: (error, archive) => React.ReactNode; // Custom error UI
  handlerRegistry?: HandlerRegistry; // Custom handlers
  enableRepair?: boolean; // Enable repair features
  enableComparison?: boolean; // Enable comparison
  className?: string;
}
```

#### 3. AdvancedFileTree (`client/src/components/advanced-file-tree.tsx`)

Recursive file tree with:

- Infinite nesting support via recursive TreeNode components
- Lazy loading for performance
- Error indicators for corrupted files
- Expand/collapse with keyboard navigation
- ARIA tree patterns for accessibility
- Search query highlighting
- Custom node rendering via render props

**Keyboard Navigation:**

- Arrow keys: Navigate tree
- Enter/Space: Select node
- Right arrow: Expand folder
- Left arrow: Collapse folder

**Accessibility:**

- ARIA tree role
- ARIA treeitem roles for nodes
- ARIA expanded state
- Keyboard focus management
- Screen reader friendly

#### 4. ErrorBoundary (`client/src/components/error-boundary.tsx`)

React error boundary providing:

- Global and per-component error catching
- Fallback UI with error details
- Action buttons: Retry, Export Log, Get Help
- Error log export as JSON
- Custom fallback rendering via props

**Usage:**

```typescript
<ErrorBoundary boundaryId="archive-manager" onError={handleError}>
  <ArchiveManager {...props} />
</ErrorBoundary>
```

### Handler System

#### Handler Registry (`client/src/lib/handler-registry.ts`)

Extensible plugin system for archive formats:

```typescript
interface ArchiveHandler {
  id: string;
  name: string;
  extensions: string[]; // e.g., ['zip', 'jar']
  mimeTypes?: string[]; // e.g., ['application/zip']
  canRepair: boolean;
  load: (data) => Promise<FileNode[]>;
  extract?: (node) => Promise<Blob>;
  repair?: (data, error) => Promise<RepairResult>;
  validate?: (node) => Promise<ValidationResult>;
}

// Register custom handler
handlerRegistry.register(myCustomHandler);

// Get handler for file
const handler = handlerRegistry.getHandlerForExtension('zip');
```

**Built-in Handlers:**

- ZIP handler with JSZip integration
- Repair capability for corrupted ZIPs
- Validation support

#### Code Repair (`client/src/lib/code-repair.ts`)

Best-effort code recovery strategies:

1. **Bracket Balancing Strategy**
   - Detects missing closing brackets/parentheses
   - Adds missing closers at end of file
   - Reports confidence score

2. **Tag Completion Strategy**
   - Completes unclosed HTML/XML tags
   - Supports JSX, Vue, Svelte
   - Ignores self-closing tags

3. **Line-by-Line Recovery Strategy**
   - Recovers valid lines from corrupted files
   - Removes null bytes and invalid UTF-8
   - Marks corrupted lines with comments

4. **Combined Strategy**
   - Applies all strategies in sequence
   - Returns comprehensive repair result

**Usage:**

```typescript
import { repairCode, detectLanguage } from '@/lib/code-repair';

const language = detectLanguage('file.js');
const result = await repairCode(corruptedContent, language, 'combined-repair');

console.log(result.repairedContent);
console.log(result.confidence); // 0-1
console.log(result.repairedSections); // Details of repairs
```

## Features

### 1. Robust Error Handling

- **Error Boundaries**: Catch React errors at component level
- **Graceful Degradation**: Show partial data when possible
- **Recovery Actions**: Retry, Export Log, Repair
- **Error Severity**: info, warning, error, critical
- **Contextual Help**: Link to documentation or support

### 2. File Recovery & Repair

- **Partial File Recovery**: Extract readable portions of corrupted files
- **Code Repair**: Fix common code issues (brackets, tags)
- **Metadata Preservation**: Show file info even if content is corrupted
- **Repair Annotations**: Mark repaired sections
- **Confidence Scoring**: Report reliability of repairs

### 3. Accessibility

- **Keyboard Navigation**: Full keyboard support
- **ARIA Patterns**: Proper semantic markup
- **Screen Reader Support**: Descriptive labels and states
- **Focus Management**: Logical tab order
- **High Contrast**: Respects system preferences

### 4. Search & Filter

- **Archive Search**: Filter by name or tags
- **File Tree Search**: Highlight matching files
- **Status Filtering**: Show only archives with issues
- **Tag-based Filtering**: Organize by categories

### 5. Archive Actions

All actions available via dropdown menu:

- **Export**: Download archive or individual files
- **Tag**: Add/edit tags for organization
- **Compare**: Compare with another archive
- **Scan**: Security/integrity scanning
- **Repair**: Attempt to fix corrupted archives
- **Delete**: Remove archive (with confirmation)
- **Analyze**: Deep analysis of contents

### 6. Progress Tracking

- **Status Indicators**: Visual status for each archive
- **Progress Bars**: Show completion percentage
- **Health Scores**: 0-100 quality rating
- **File Counts**: Track total and corrupted files
- **Badges**: Quick visual status

## Integration

### Basic Usage

```typescript
import { AdvancedArchiveManager } from '@/components/advanced-archive-manager';
import type { Archive, ArchiveAction } from '@shared/archive-types';

function MyApp() {
  const [archives, setArchives] = useState<Archive[]>([...]);

  const handleAction = async (
    archiveId: string,
    action: ArchiveAction,
    params?: any
  ) => {
    switch (action) {
      case 'export':
        await exportArchive(archiveId);
        break;
      case 'repair':
        await repairArchive(archiveId);
        break;
      // ... handle other actions
    }
  };

  return (
    <AdvancedArchiveManager
      archives={archives}
      onArchiveAction={handleAction}
      selectedArchiveId={selectedId}
      enableRepair={true}
      enableComparison={true}
    />
  );
}
```

### Custom Rendering

```typescript
<AdvancedArchiveManager
  archives={archives}
  onArchiveAction={handleAction}
  renderFileTree={(archive, fileTree) => (
    <CustomFileTree files={fileTree} />
  )}
  renderArchiveDetails={(archive) => (
    <CustomDetails archive={archive} />
  )}
  renderError={(error, archive) => (
    <CustomErrorUI error={error} />
  )}
/>
```

### Custom Handlers

```typescript
import { handlerRegistry } from '@/lib/handler-registry';

const tarHandler: ArchiveHandler = {
  id: 'tar-handler',
  name: 'TAR Archive Handler',
  extensions: ['tar', 'tar.gz', 'tgz'],
  mimeTypes: ['application/x-tar'],
  canRepair: false,
  async load(data) {
    // Implement TAR parsing
    return fileTree;
  },
};

handlerRegistry.register(tarHandler);
```

## Extension Points

### 1. Custom Archive Handlers

Implement the `ArchiveHandler` interface to support new formats:

- RAR, 7z, TAR, etc.
- Custom compression formats
- Encrypted archives

### 2. Custom Repair Strategies

Implement `CodeRepairStrategy` for domain-specific repairs:

- Language-specific fixes
- Project structure repairs
- Configuration file repairs

### 3. Custom Panels

Use render props to add custom UI:

- AI-powered analysis panels
- Comparison visualization
- Activity logs
- Custom metrics

### 4. Custom Actions

Extend `ArchiveAction` type and handle in `onArchiveAction`:

- Custom workflows
- Integration with external tools
- Batch operations

## Best Practices

### 1. Error Handling

- Always wrap components in ErrorBoundary
- Provide meaningful error messages
- Offer recovery actions when possible
- Log errors for debugging

### 2. Performance

- Use lazy loading for large file trees
- Implement pagination for many archives
- Debounce search inputs
- Memoize expensive computations

### 3. Accessibility

- Test with keyboard only
- Test with screen readers
- Provide focus indicators
- Use semantic HTML

### 4. User Experience

- Show loading states
- Provide progress feedback
- Confirm destructive actions
- Allow undo when possible

## Contributing

When contributing to the ArchiveManager:

1. **Follow the type system**: Use the types defined in `shared/archive-types.ts`
2. **Add JSDoc comments**: Document all public interfaces
3. **Maintain accessibility**: Test keyboard and screen reader support
4. **Handle errors gracefully**: Use ErrorBoundary and provide recovery options
5. **Write extensible code**: Support render props and custom handlers

### Adding a New Archive Format Handler

1. Create handler implementing `ArchiveHandler` interface
2. Register with `handlerRegistry.register(handler)`
3. Implement `load()` method to parse format
4. Optionally implement `repair()`, `extract()`, `validate()`
5. Add tests for the handler

### Adding a New Repair Strategy

1. Implement `CodeRepairStrategy` interface
2. Define repair logic in `repair()` method
3. Return repaired content with annotations
4. Calculate confidence score
5. Add to strategy registry

## License

Part of the ZipWizard project.
