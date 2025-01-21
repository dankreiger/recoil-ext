# Recoil Utils

[![npm version](https://img.shields.io/npm/v/@your-org/recoil-utils)](https://www.npmjs.com/package/@your-org/recoil-utils)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)
[![TypeScript](https://badgen.net/badge/Language/TypeScript/blue)](#typescript-support)

A **collection of utilities and helpers** for working with [Recoil](https://recoiljs.org/) state management in React applications. This package provides **type-safe**, **production-ready** solutions for common Recoil patterns, including:

- **🏢 Entity Management**: Normalized data & CRUD operations (inspired by Normalizr, Redux Toolkit, and NGRX).
- **💾 IndexedDB Persistence**: Effortless, asynchronous local storage of Recoil state.
- **🐛 Debug Observer**: Real-time logging of atom/selector updates in development.

> **Note**:
> `recoil` and `react` are **peer dependencies**. You must install them separately to avoid duplication in your bundle.

---

## Table of Contents

- [Recoil Utils](#recoil-utils)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Entity Adapter](#entity-adapter)
    - [IndexedDB Persistence](#indexeddb-persistence)
    - [Debug Observer](#debug-observer)
  - [Features](#features)
    - [🏢 Entity Adapter](#-entity-adapter)
      - [Example](#example)
    - [💾 IndexedDB Effect](#-indexeddb-effect)
    - [🐛 Debug Observer](#-debug-observer)
  - [API Reference](#api-reference)
    - [Entity Adapter](#entity-adapter-1)
    - [IndexedDB Effect Options](#indexeddb-effect-options)
  - [Best Practices](#best-practices)
    - [Entity Adapter](#entity-adapter-2)
    - [IndexedDB Effect](#indexeddb-effect)
  - [TypeScript Support](#typescript-support)
  - [Contributing](#contributing)
  - [License](#license)
  - [Related Projects](#related-projects)

---

## Installation

```bash
# via npm
npm install @your-org/recoil-utils recoil

# via yarn
yarn add @your-org/recoil-utils recoil

# via pnpm
pnpm add @your-org/recoil-utils recoil

# via bun
bun add @your-org/recoil-utils recoil

# via deno (example, not an official CLI command)
deno add @your-org/recoil-utils recoil
```

> **Why are `recoil` and `react` not included as dependencies?**
> This ensures **proper deduplication** in your project, preventing multiple copies of Recoil or React when bundling.

---

## Usage

### Entity Adapter

```typescript
// 1. Define your entity type
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

// 2. Create an adapter (do this outside components)
const todoAdapter = createEntityAdapter<Todo, 'id'>({
  key: 'todos',
  idKey: 'id'
});

// 3. Use in your components
function TodoApp() {
  // Get all entities
  const todos = todoAdapter.useAllEntities();

  // Get CRUD actions
  const {
    addOne,
    addMany,
    updateOne,
    upsertOne,
    removeOne,
    removeMany,
    setAll
  } = todoAdapter.createUseEntityActions()();

  // Example usage
  const addTodo = (text: string) => {
    addOne({
      id: Date.now().toString(),
      text,
      completed: false
    });
  };

  const toggleTodo = (id: string, completed: boolean) => {
    updateOne({
      id,
      changes: { completed }
    });
  };

  return (
    <div>
      <button onClick={() => addTodo("New Todo")}>Add Todo</button>
      {todos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={e => toggleTodo(todo.id, e.target.checked)}
          />
          {todo.text}
          <button onClick={() => removeOne(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

// 4. Efficient single entity access
function TodoItem({ id }: { id: string }) {
  const useOneTodo = todoAdapter.createUseOneEntity();
  const todo = useOneTodo(id);

  if (!todo) return null;
  return <div>{todo.text}</div>;
}
```

### IndexedDB Persistence

```typescript
// 1. Define your state type
interface UserPreferences {
  theme: 'light' | 'dark';
  fontSize: number;
  notifications: boolean;
}

// 2. Create a persisted atom
const preferencesAtom = atom<UserPreferences>({
  key: 'userPreferences',
  default: {
    theme: 'light',
    fontSize: 16,
    notifications: true
  },
  effects: [
    idbEffect({
      dbName: 'MyApp',
      storeName: 'preferences',
      key: 'userPrefs'
    })
  ]
});

// 3. Use in your components
function PreferencesComponent() {
  const [preferences, setPreferences] = useRecoilState(preferencesAtom);

  const toggleTheme = () => {
    setPreferences(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  // Changes will automatically persist to IndexedDB
  return (
    <div>
      <button onClick={toggleTheme}>
        Current theme: {preferences.theme}
      </button>
    </div>
  );
}
```

### Debug Observer

```typescript
// 1. Add to your app root
function App() {
  return (
    <RecoilRoot>
      {process.env.NODE_ENV === 'development' && <DebugObserver />}
      <AppContent />
    </RecoilRoot>
  );
}

// 2. Watch console for state changes
// Example output:
// The following atoms were modified:
// userPreferences: { value: { theme: "dark", fontSize: 16 }, state: "hasValue" }
// todos: { value: [...], state: "hasValue" }
```

---

## Features

### 🏢 Entity Adapter

A **powerful utility** for managing normalized collections of entities in Recoil, heavily inspired by [Redux Toolkit's `createEntityAdapter`](https://redux-toolkit.js.org/usage/usage-with-typescript#createentityadapter).

**Key Benefits**:

- **Normalized State**: Keep a `Record` of entities and an array of `ids`.
- **CRUD Methods**: Add, update, remove, upsert, etc.
- **Sorting**: Optional `sortComparer` to keep your entities ordered.
- **Selectors & Hooks**: Easy access to all entities or a single entity by ID.

#### Example

```ts
import { createEntityAdapter } from '@your-org/recoil-utils';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

// 1) Create the adapter
const todoAdapter = createEntityAdapter<Todo, 'id'>({
  key: 'todos',       // Recoil atom key
  idKey: 'id',        // The property holding the unique ID
  initialState: [],   // optional initial state
  sortComparer: (a, b) => b.createdAt - a.createdAt
});

// 2) Use it in components
function TodoList() {
  // Retrieve all todos (sorted if a sortComparer was provided)
  const todos = todoAdapter.useAllEntities();

  // Get entity actions for CRUD
  const { addOne, removeOne, updateOne } = todoAdapter.createUseEntityActions()();

  return (
    <div>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onUpdate={updateOne}
          onRemove={removeOne}
        />
      ))}
      <button onClick={() => addOne({
        id: 'new1',
        text: 'New task',
        completed: false,
        createdAt: Date.now()
      })}>
        Add New Todo
      </button>
    </div>
  );
}

// Access individual todo efficiently
function TodoItem({ id }: { id: string }) {
  const useOneTodo = todoAdapter.createUseOneEntity();
  const todo = useOneTodo(id);

  if (!todo) return null;
  return <div>{todo.text}</div>;
}
```

---

### 💾 IndexedDB Effect

**Persist** your Recoil atoms to **IndexedDB** with minimal setup. The effect handles async storage operations and state synchronization for you.

```ts
import { atom } from 'recoil';
import { idbEffect } from '@your-org/recoil-utils';

interface UserSettings {
  theme: string;
  language: string;
}

// Create an atom that syncs automatically to IndexedDB
export const persistedSettingsAtom = atom<UserSettings>({
  key: 'persistedSettings',
  default: {
    theme: 'light',
    language: 'en'
  },
  effects: [
    idbEffect({
      dbName: 'MyApp',
      storeName: 'settings',
      key: 'userSettings'
    })
  ]
});

// Usage
function SettingsComponent() {
  const [settings, setSettings] = useRecoilState(persistedSettingsAtom);
  // `settings` changes automatically persist to IndexedDB
  return (
    <div>
      <p>Theme: {settings.theme}</p>
      <button onClick={() => setSettings(prev => ({ ...prev, theme: 'dark' }))}>
        Dark Mode
      </button>
    </div>
  );
}
```

---

### 🐛 Debug Observer

A **development** tool that logs **all atom and selector modifications** to the console in real-time. Super handy for debugging complex state changes.

```ts
import { RecoilRoot } from 'recoil';
import { DebugObserver } from '@your-org/recoil-utils';

function App() {
  return (
    <RecoilRoot>
      {process.env.NODE_ENV === 'development' && <DebugObserver />}
      <MyMainApp />
    </RecoilRoot>
  );
}
```

Whenever an atom updates, you'll see a console message with the new value.

---

## API Reference

### Entity Adapter

```ts
interface EntityAdapter<T, Id extends string> {
  // Holds the Recoil state for all your entities
  entityAtom: RecoilState<EntityState<T, Id>>;

  // Generates a fresh initial state for convenience
  getInitialState: () => EntityState<T, Id>;

  // Returns all entities as a readonly array
  useAllEntities: () => ReadonlyArray<T>;

  // Creates a hook for selecting a single entity by ID
  createUseOneEntity: () => (id: Id) => T | undefined;

  // Creates a hook that returns typed actions for mutating the entity state
  createUseEntityActions: () => () => {
    addOne: (entity: T) => void;
    addMany: (entities: ReadonlyArray<T>) => void;
    setAll: (entities: ReadonlyArray<T>) => void;
    updateOne: (update: { id: Id; changes: Partial<T> }) => void;
    upsertOne: (entity: T) => void;
    removeOne: (id: Id) => void;
    removeMany: (ids: ReadonlyArray<Id>) => void;
  };
}
```

**Common Functions:**

- `addOne(entity: T)`: Insert a new entity if it's not already present.
- `upsertOne(entity: T)`: Insert or replace an entity by ID.
- `updateOne({ id, changes })`: Partially update an entity.
- `removeOne(id)`: Remove an entity from the store.

---

### IndexedDB Effect Options

```ts
interface IndexedDBEffectOptions {
  /**
   * Name of the IndexedDB database
   */
  dbName: string;

  /**
   * Name of the object store within the database
   */
  storeName: string;

  /**
   * Unique key for this value in the store
   */
  key: string;
}
```

**Key Points**:

- **`dbName`**: The database name. If it doesn't exist, it will be created automatically.
- **`storeName`**: The name of the object store. Must be created in `onupgradeneeded`.
- **`key`**: The record key within the store used to save/retrieve the atom's value.

---

## Best Practices

### Entity Adapter

1. **Create adapters at module level** – outside of components for better reuse.
2. **Use `useAllEntities` for listing** – straightforward read of your entire collection.
3. **Use `createUseOneEntity` for detail views** – more efficient, re-renders only if that single entity changes.
4. **Prefer `upsertOne`** over `addOne` if the entity may exist already.
5. **Consider storing only IDs** in the adapter if you want advanced performance (like referencing separate data structures).

### IndexedDB Effect

1. **One DB per app**: Generally, keep it simple—storing multiple unrelated features in the same DB is okay.
2. **Group related data**: Use the same `storeName` for items that logically belong together.
3. **Versioning**: Plan how you'll handle major structure changes (e.g., by incrementing the DB version).
4. **Handle initial loading states**: `onSet` or a small loading spinner, in case you need to wait for IDB readiness.

---

## TypeScript Support

This library is written in **TypeScript** with **strict type checking**. All interfaces and types are `readonly` by default to encourage immutability and reduce accidental mutations.

You'll benefit from:

- **Full autocompletion** in your IDE (e.g., VSCode).
- **Compile-time safety** for entity adapter usage, effect configuration, etc.

---

## Contributing

Contributions are always welcome!

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to your branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please adhere to the existing code style and add tests where relevant.

---

## License

[MIT](./LICENSE) © [Your Name or Organization]
Use it, learn from it, build amazing Recoil apps with it!

---

## Related Projects

- [**Recoil**](https://recoiljs.org/) – The core state management library for React.
- [**normalizr**](https://github.com/paularmstrong/normalizr) – A utility for normalizing nested JSON according to a schema.
- [**Redux Toolkit**](https://redux-toolkit.js.org/) – Inspiration for the entity adapter pattern.
[- https://ngrx.io/](https://ngrx.io/guide/entity/adapter)
- [**IDB**](https://github.com/jakearchibald/idb) – A small library for async IndexedDB, useful if you want an even cleaner API.
