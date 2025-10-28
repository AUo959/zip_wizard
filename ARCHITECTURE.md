# ZipWizard - View System Architecture

## 📋 Overview

This document describes the refactored view system architecture that ensures type safety, maintainability, and prevents common pitfalls when adding new views or features.

## 🎯 Core Principles

### 1. Single Source of Truth

All views are defined in **ONE place only**: `shared/views.ts`

```typescript
export const ALL_VIEWS = [
  'main',
  'status',
  'ai',
  // ... all other views
] as const;
```

### 2. Type Safety by Design

The `ViewType` is automatically inferred from `ALL_VIEWS`:

```typescript
export type ViewType = (typeof ALL_VIEWS)[number];
```

This means:

- ✅ No manual union type maintenance
- ✅ TypeScript catches typos at compile time
- ✅ Exhaustive checking in switch statements
- ✅ Auto-completion in IDEs

### 3. Database Validation

All array/object fields are validated before database insertion:

```typescript
import { normalizeTags, normalizeDependencies } from '@shared/validation';

const file = {
  ...fileData,
  tags: normalizeTags(incomingTags),
  dependencies: normalizeDependencies(incomingDeps),
};
```

## 🚀 How to Add a New View

### Step 1: Update ALL_VIEWS

Edit `shared/views.ts` and add your view to the array:

```typescript
export const ALL_VIEWS = [
  'main',
  'status',
  // ... existing views
  'my-new-view', // ← Add here
] as const;
```

### Step 2: Add View Metadata

Update the `VIEW_METADATA` object:

```typescript
export const VIEW_METADATA: Record<ViewType, { icon: string; label: string; description: string }> =
  {
    // ... existing metadata
    'my-new-view': {
      icon: '🎨',
      label: 'My New View',
      description: 'Description of what this view does',
    },
  };
```

### Step 3: Add Switch Case

In `client/src/pages/home.tsx`, add a case in `renderCurrentView()`:

```typescript
const renderCurrentView = (): JSX.Element => {
  switch (currentView) {
    // ... existing cases

    case "my-new-view":
      return <MyNewViewComponent />;

    // ... rest of cases
  }
};
```

That's it! Navigation buttons, type checking, and routing will all work automatically.

## 🛡️ Type Safety Guarantees

### Exhaustive Switch Checking

TypeScript will error if you forget to handle a view:

```typescript
switch (currentView) {
  case "main": return <MainView />;
  // If you forget other cases, TypeScript will error!
}
```

### Runtime Validation

Use the provided type guard for user input:

```typescript
import { isValidView } from '@shared/views';

if (isValidView(userInput)) {
  setCurrentView(userInput); // Safe!
} else {
  console.error('Invalid view:', userInput);
}
```

### Database Array Validation

Never insert raw arrays into the database:

```typescript
// ❌ DON'T DO THIS
await db.insert(files).values({ tags: someUnknownValue });

// ✅ DO THIS
import { normalizeTags } from '@shared/validation';
await db.insert(files).values({
  tags: normalizeTags(someUnknownValue),
});
```

## 📚 API Reference

### `shared/views.ts`

#### `ALL_VIEWS`

Readonly tuple of all application views. This is the single source of truth.

#### `ViewType`

Union type auto-generated from `ALL_VIEWS`. Use for all view-related type annotations.

#### `VIEW_METADATA`

Metadata for each view (icon, label, description). Used for UI rendering.

#### `isValidView(value: unknown): value is ViewType`

Type guard to check if a value is a valid view at runtime.

### `shared/validation.ts`

#### `normalizeTags(tags: unknown): string[]`

Validates and normalizes tags input to a safe string array.

**Handles:**

- Arrays (validates all elements are strings)
- JSON strings
- Single values
- Null/undefined (returns empty array)

#### `normalizeDependencies(deps: unknown): string[]`

Same as `normalizeTags` but for dependencies.

#### `normalizeJsonField<T>(value: unknown): T | null`

Validates any JSON field is serializable before database insertion.

#### `isStringArray(value: unknown): value is string[]`

Type guard for string arrays.

## 🔧 Development Workflow

### Before Making Changes

1. Check `shared/views.ts` for existing views
2. Check `VIEW_METADATA` for view configuration
3. Review `shared/validation.ts` for data validation utilities

### After Making Changes

1. Run `npm run check` to verify type safety
2. Test navigation between views
3. Verify database operations with validated data

### Common Pitfalls to Avoid

#### ❌ Don't: Add string literals directly

```typescript
// BAD
setCurrentView('some-new-view'); // Type error if not in ALL_VIEWS
```

#### ✅ Do: Add to ALL_VIEWS first

```typescript
// GOOD - Add to ALL_VIEWS in shared/views.ts
// Then use it anywhere
setCurrentView('some-new-view'); // Type safe!
```

#### ❌ Don't: Insert raw arrays to database

```typescript
// BAD
await db.insert(files).values({ tags: rawTags });
```

#### ✅ Do: Validate first

```typescript
// GOOD
await db.insert(files).values({
  tags: normalizeTags(rawTags),
});
```

## 🧪 Testing

### Type Safety Tests

TypeScript compilation itself tests type safety:

```bash
npm run check
```

### Runtime Validation Tests

Test the validation utilities:

```typescript
import { normalizeTags, isValidView } from '@shared/validation';

console.assert(Array.isArray(normalizeTags('test')));
console.assert(normalizeTags(null).length === 0);
console.assert(isValidView('main') === true);
console.assert(isValidView('invalid') === false);
```

## 📖 Further Reading

- [TypeScript Handbook - Literal Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)
- [Exhaustiveness Checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## 🤝 Contributing

When contributing new views or features:

1. **Always update `ALL_VIEWS` first** - Never add view strings elsewhere
2. **Validate database inputs** - Use provided normalization functions
3. **Add JSDoc comments** - Document your code for future contributors
4. **Run type checks** - Ensure `npm run check` passes
5. **Update this README** - If you add new patterns or utilities

## 📝 Change Log

### 2025-10-28 - Major Refactor

- Created centralized view type system in `shared/views.ts`
- Implemented database validation utilities in `shared/validation.ts`
- Updated all view references to use centralized types
- Added exhaustive switch checking
- Improved type safety across the codebase

---

**Remember:** The refactored system prevents bugs at compile time rather than finding them at runtime. Follow these patterns and TypeScript will help you write correct code! 🎉
