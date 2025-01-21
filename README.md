- [recoil-ext](#recoil-ext)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Features](#features)
    - [Entity Adapter](#entity-adapter)
    - [IndexedDB Persistence](#indexeddb-persistence)
    - [Debug Observer](#debug-observer)
  - [Usage \& Examples](#usage--examples)
    - [Entity Adapter Example](#entity-adapter-example)
    - [IndexedDB Persistence Example](#indexeddb-persistence-example)
    - [Debug Observer Example](#debug-observer-example)
  - [API Reference](#api-reference)
    - [Entity Adapter](#entity-adapter-1)
    - [IndexedDB Effect](#indexeddb-effect)
    - [Debug Observer](#debug-observer-1)
  - [Best Practices](#best-practices)
    - [Database Organization](#database-organization)
    - [Data Loading](#data-loading)
    - [Development Tools](#development-tools)
  - [TypeScript Support](#typescript-support)
  - [Contributing](#contributing)
  - [License](#license)
  - [Related Projects](#related-projects)

# recoil-ext

[![npm version](https://img.shields.io/npm/v/recoil-ext)](https://www.npmjs.com/package/recoil-ext)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)
[![TypeScript](https://badgen.net/badge/Language/TypeScript/blue)](#typescript-support)

**recoil-ext** provides utility functions for [Recoil](https://recoiljs.org/) state management in React applications. It focuses on normalized data handling, IndexedDB persistence, and state debugging tools.

## Table of Contents

- [recoil-ext](#recoil-ext)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Features](#features)
    - [Entity Adapter](#entity-adapter)
    - [IndexedDB Persistence](#indexeddb-persistence)
    - [Debug Observer](#debug-observer)
  - [Usage \& Examples](#usage--examples)
    - [Entity Adapter Example](#entity-adapter-example)
    - [IndexedDB Persistence Example](#indexeddb-persistence-example)
    - [Debug Observer Example](#debug-observer-example)
  - [API Reference](#api-reference)
    - [Entity Adapter](#entity-adapter-1)
    - [IndexedDB Effect](#indexeddb-effect)
    - [Debug Observer](#debug-observer-1)
  - [Best Practices](#best-practices)
    - [Database Organization](#database-organization)
    - [Data Loading](#data-loading)
    - [Development Tools](#development-tools)
  - [TypeScript Support](#typescript-support)
  - [Contributing](#contributing)
  - [License](#license)
  - [Related Projects](#related-projects)

## Installation

This package requires `recoil` and `react` as peer dependencies.

```bash
npm install recoil-ext recoil react
```

Compatible with:

- Recoil ^0.7.0
- React ^17.0.0 || ^18.0.0

## Features

### Entity Adapter

Provides normalized storage for collections of data with consistent CRUD operations:

- Stores entities in a normalized format (dictionary by ID)
- Maintains ordered ID list
- TypeScript support for entity types and operations

### IndexedDB Persistence

Syncs atom state with IndexedDB:

- Automatic read on initialization
- Writes on state changes
- Configurable database and store names
- Error handling with fallbacks

### Debug Observer

Development tool for monitoring Recoil state changes:

- Logs atom/selector updates
- Shows previous and current values
- Development-only by default

## Usage & Examples

### Entity Adapter Example

```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

// Create adapter
const todoAdapter = createEntityAdapter<Todo, 'id'>({
  key: 'todoState',
  idKey: 'id'
});

// Use in component
function TodoList() {
  const todos = todoAdapter.useAllEntities();
  const { addOne, removeOne, updateOne } = todoAdapter.createUseEntityActions()();

  return (
    <div>
      <button onClick={() => addOne({
        id: Date.now().toString(),
        text: 'New Todo',
        completed: false
      })}>
        Add Todo
      </button>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={e => updateOne({
                id: todo.id,
                changes: { completed: e.target.checked }
              })}
            />
            {todo.text}
            <button onClick={() => removeOne(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### IndexedDB Persistence Example

```typescript
interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
}

const settingsAtom = atom<UserSettings>({
  key: 'settingsAtom',
  default: {
    theme: 'light',
    notifications: true
  },
  effects: [
    idbEffect({
      dbName: 'AppDB',
      storeName: 'settings',
      key: 'userSettings'
    })
  ]
});

function Settings() {
  const [settings, setSettings] = useRecoilState(settingsAtom);

  return (
    <div>
      <h2>Settings</h2>
      <label>
        Theme:
        <select
          value={settings.theme}
          onChange={e => setSettings(prev => ({
            ...prev,
            theme: e.target.value as 'light' | 'dark'
          }))}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </div>
  );
}
```

### Debug Observer Example

```typescript
import { DebugObserver } from 'recoil-ext';

function App() {
  return (
    <RecoilRoot>
      {process.env.NODE_ENV === 'development' && <DebugObserver />}
      <YourApp />
    </RecoilRoot>
  );
}
```

## API Reference

### Entity Adapter

```typescript
function createEntityAdapter<T, K extends keyof T>(options: {
  key: string;            // Recoil atom key (for state)
  idKey: K;              // Entity ID field
  initialState?: T[];    // Optional initial entities
}): {
  useAllEntities: () => T[];

  createUseEntityActions: () => {
    addOne: (entity: T) => void;
    addMany: (entities: T[]) => void;
    updateOne: (update: { id: T[K]; changes: Partial<T> }) => void;
    removeOne: (id: T[K]) => void;
    removeMany: (ids: T[K][]) => void;
  };
  // Additional methods documented in source code
}
```

### IndexedDB Effect

```typescript
function idbEffect<T>(options: {
  dbName: string;     // Database name
  storeName: string;  // Object store name
  key: string;        // Storage key
}): AtomEffect<T>
```

Error handling:

- Falls back to atom default if read fails
- Logs errors in development
- Continues operating if persistence fails

### Debug Observer

Component that logs state changes to console:

```typescript
function DebugObserver(): JSX.Element
```

Output format:

```typescript
interface DebugLog {
  key: string;
  previous: unknown;
  current: unknown;
  timestamp: number;
}
```

## Best Practices

### Database Organization

Consider these factors when structuring IndexedDB storage:

- Group related data in the same store
- Use separate databases for distinct features
- Plan for version upgrades
- Handle storage limits

### Data Loading

Recommendations for server data:

- Load data before storing in adapters
- Handle loading states explicitly
- Consider cache invalidation
- Implement error boundaries

### Development Tools

Debug Observer usage:

- Enable only in development
- Use with React DevTools
- Consider performance impact
- Filter noise as needed

## TypeScript Support

Type checking covers:

- Entity shapes and ID fields
- Action parameters
- State updates
- Database operations

Limitations:

- Runtime type information not available
- Some advanced type patterns may require explicit annotations
- Generic constraints follow TypeScript rules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Update documentation
5. Submit pull request

Development requirements:

- Node.js 16+
- TypeScript 4.5+
- Jest for testing

## License

MIT License

## Related Projects

- [Recoil](https://recoiljs.org/) - Core state management
- [Redux Toolkit](https://redux-toolkit.js.org/) - Similar entity patterns
- [IDB](https://github.com/jakearchibald/idb) - IndexedDB utilitie
