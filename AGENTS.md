# AGENTS.md

This file contains guidelines for agentic coding tools working in this repository.

## Development Commands

```bash
# Development server with hot-reload
pnpm dev

# Type checking (run this before committing)
pnpm type-check

# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

**Note**: This project uses `vue-tsc` for type checking. No test framework is currently configured. When adding tests, use Vitest or a similar Vue-compatible test framework.

## Code Style Guidelines

**Vue Components**: Use `<script setup lang="ts">` with Composition API. Organize imports: 1) Vue/API, 2) Internal, 3) Types. Use `@/` alias for src imports.

**TypeScript**: Strict mode enabled. Explicit types for params/returns. Define props/emits with TypeScript interfaces. Minimize `any` usage.

```ts
// Good example
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Comp } from '@/types/component'

interface Props { components: Comp[] }
const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update', comp: Comp): void }>()
```

**Pinia Stores**: Use `defineStore` with Composition API style, lowercase names (`useEditorStore`), `storeToRefs` for destructuring.

```ts
// Good example
export const useEditorStore = defineStore('editor', () => {
  const mode = ref<EditorMode>(EditorMode.DESIGN)
  const isDesignMode = computed(() => mode.value === EditorMode.DESIGN)
  function switchToDesign() { mode.value = EditorMode.DESIGN }
  return { mode, isDesignMode, switchToDesign }
})
```

**Naming**: Components PascalCase (`Board.vue`), utils/stores camelCase (`editor.ts`), functions camelCase (`handleClick`), types PascalCase (`CompType`).

**Auto-imports**: Vue APIs (`ref`, `computed`) and Naive UI composables (`useMessage`, `useDialog`) are auto-imported via `unplugin-auto-import`. Naive UI components are auto-imported via `unplugin-vue-components`. Explicitly import utilities and types from `@/` paths.

**Error Handling**: Use try-catch for async operations that may fail. Use axios interceptors (already configured in `src/utils/http.ts`) for centralized HTTP error handling. Log errors with context: `console.error('[ContextName]', error)`

```ts
// Good example
try {
  await fetchData()
} catch (error) {
  console.error('[ComponentName] Failed to fetch data:', error)
  message.error('Failed to load data')
}
```

**Styling**: Scoped styles in components to avoid conflicts. CSS variables for theme-related values. Prefer flexbox/grid over absolute positioning when possible.

**Comments**: Add comments for complex logic only. Chinese comments appropriate. Avoid commenting obvious code.

### Patterns to Follow

- **State Management**: Use Pinia stores for cross-component state
- **API Calls**: Use the configured `request` object from `src/utils/http.ts`
- **Routing**: Use Vue Router, define routes in `src/router/index.ts`
- **ID Generation**: Use `newComponentId()` from `src/utils/id.ts` for unique IDs
- **Component Creation**: Use `createComp()` from `src/components/comps/base.ts`
- **Component Binding**: Use `v-bind` with props spreading for complex bindings
- **Event Handling**: Define emit types with generic syntax for better type inference

### Anti-patterns

- ❌ Don't use Options API; stick to Composition API
- ❌ Don't modify props directly; emit events to parent
- ❌ Don't store non-serializable data in Pinia stores
- ❌ Don't use `any` without `@ts-ignore` or proper eslint disable comment
- ❌ Don't put large amounts of CSS in `<style>` sections - extract to CSS modules if complex
- ❌ Don't create global variables; use stores or composables instead
- ❌ Don't access DOM directly in setup; use refs and lifecycle hooks

### Adding New Features

1. Create type definitions in `src/types/` if introducing new data structures
2. Add utility functions in `src/utils/` for reusable logic
3. Create stores in `src/stores/` for state that needs sharing
4. Place components in appropriate `src/components/` subdirectories
5. Register new Naive UI component resolvers in `vite.config.ts` if needed

### Project Structure Notes

- `/src/components/comps` - Base component implementations (Button, Text, Container)
- `/src/components/layout` - Layout components (Board, TopBar, PropertiesPanel)
- `/src/components/flow` - Flow editor components (nodes, canvas)
- `/src/components/data` - Data table components
- `/src/stores` - Pinia stores (editor, page, user, etc.)
- `/src/utils` - Utility functions (http, history, binding, etc.)
- `/src/types` - TypeScript type definitions
- `/src/views` - Page-level views (PageView, FlowView, DataView, LoginView)
- `/src/config` - Configuration files (Naive UI registry, actions)

### Performance Considerations

- Use `computed` for derived values to avoid unnecessary recalculations
- Use `watchEffect` sparingly; prefer `watch` with specific sources
- Lazy-load heavy components with `defineAsyncComponent`
- Use `v-show` instead of `v-if` for frequent toggles
- Debounce/throttle expensive operations (scroll, resize, input)
- Prefer `shallowRef` for large object references when deep reactivity isn't needed
