/**
 * CENTRALIZED VIEW TYPE DEFINITION
 * 
 * This file is the single source of truth for all ZipWizard view types.
 * Never add view strings elsewhere - always update ALL_VIEWS here.
 * 
 * @see ALL_VIEWS - The exhaustive list of all application views
 * @see ViewType - Auto-inferred union type from ALL_VIEWS
 */

/**
 * Exhaustive readonly tuple of all ZipWizard application views.
 * Add new views here only - navigation and rendering will auto-update.
 */
export const ALL_VIEWS = [
  "main",
  "status",
  "ai",
  "analytics",
  "mushin",
  "symbolic",
  "archive-manager",
  "privacy",
  "multilingual",
  "flow-manager",
  "wu-wei",
  "memory-compression",
  "cognitive-load",
  "pattern-recognition",
  "incremental-processor",
  "archive-comparison",
  "vulnerability-scanner",
  "dependency-graph",
  "code-metrics",
  "timing-optimizer",
  "circuit-breaker"
] as const;

/**
 * Union type auto-generated from ALL_VIEWS.
 * Use this for all view-related type annotations.
 * 
 * @example
 * ```typescript
 * const [currentView, setCurrentView] = useState<ViewType>("main");
 * ```
 */
export type ViewType = typeof ALL_VIEWS[number];

/**
 * Type guard to check if a string is a valid ViewType.
 * Useful for runtime validation of user input or API responses.
 * 
 * @param value - The value to check
 * @returns True if value is a valid ViewType
 * 
 * @example
 * ```typescript
 * if (isValidView(userInput)) {
 *   setCurrentView(userInput);
 * }
 * ```
 */
export function isValidView(value: unknown): value is ViewType {
  return typeof value === 'string' && (ALL_VIEWS as readonly string[]).includes(value);
}

/**
 * View metadata for display purposes.
 * Add metadata for each view defined in ALL_VIEWS.
 */
export const VIEW_METADATA: Record<ViewType, { icon: string; label: string; description: string }> = {
  "main": {
    icon: "📁",
    label: "Files",
    description: "Browse and manage archive files"
  },
  "status": {
    icon: "📊",
    label: "Status",
    description: "System status dashboard"
  },
  "ai": {
    icon: "🤖",
    label: "AI Tools",
    description: "AI-powered exploration and analysis"
  },
  "analytics": {
    icon: "📈",
    label: "Analytics",
    description: "Archive analytics and insights"
  },
  "mushin": {
    icon: "🎯",
    label: "Mushin",
    description: "No-mind processing state"
  },
  "symbolic": {
    icon: "⚡",
    label: "Symbolic",
    description: "Symbolic interface for advanced commands"
  },
  "archive-manager": {
    icon: "📦",
    label: "Archive Manager",
    description: "Enhanced archive management"
  },
  "privacy": {
    icon: "🛡️",
    label: "Privacy Shield",
    description: "Privacy and security controls"
  },
  "multilingual": {
    icon: "🌍",
    label: "Multilingual",
    description: "Language and localization settings"
  },
  "flow-manager": {
    icon: "🧘",
    label: "Flow States",
    description: "Flow state management"
  },
  "wu-wei": {
    icon: "💫",
    label: "Wu Wei",
    description: "Effortless action interface"
  },
  "memory-compression": {
    icon: "🗜️",
    label: "Compression",
    description: "Memory compression and optimization"
  },
  "cognitive-load": {
    icon: "🧠",
    label: "Cognitive Load",
    description: "Cognitive load reduction tools"
  },
  "pattern-recognition": {
    icon: "🔍",
    label: "Patterns",
    description: "Pattern recognition engine"
  },
  "incremental-processor": {
    icon: "⚡",
    label: "Incremental",
    description: "Incremental processing system"
  },
  "archive-comparison": {
    icon: "🔄",
    label: "Compare",
    description: "Archive comparison tools"
  },
  "vulnerability-scanner": {
    icon: "🔒",
    label: "Security",
    description: "Vulnerability scanner"
  },
  "dependency-graph": {
    icon: "🕸️",
    label: "Dependencies",
    description: "Dependency graph visualization"
  },
  "code-metrics": {
    icon: "📊",
    label: "Metrics",
    description: "Code metrics analyzer"
  },
  "timing-optimizer": {
    icon: "⏱️",
    label: "Timing",
    description: "Timing optimization tools"
  },
  "circuit-breaker": {
    icon: "🔌",
    label: "Circuit Breaker",
    description: "Circuit breaker monitoring"
  }
};
