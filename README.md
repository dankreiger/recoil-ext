# recoil-ext

[![npm version](https://img.shields.io/npm/v/recoil-ext)](https://www.npmjs.com/package/recoil-ext)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)
[![TypeScript](https://badgen.net/badge/Language/TypeScript/blue)](#typescript-support)

**recoil-ext** is a **collection of helpers and utilities** designed to supercharge your [Recoil](https://recoiljs.org/) state management in React applications. It's ideal for building large-scale apps that need **type-safe, normalized data** handling, **persistence** to IndexedDB, and easy **state debugging**.

> **Why use recoil-ext?**
>
> - You have **lists of data** (entities) you want to store in a Recoil atom (e.g., tasks, products, messages).
> - You prefer **Redux Toolkit–style** entity adapters for CRUD operations.
> - You want **persistence** (storing user preferences, or offline data) without fussing over raw IndexedDB APIs.
> - You need a simple **debug tool** to watch all Recoil state changes in real-time.

---

## Table of Contents

- [recoil-ext](#recoil-ext)
  - [Table of Contents](#table-of-contents)
  - [What is Recoil?](#what-is-recoil)
  - [Overview of recoil-ext](#overview-of-recoil-ext)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
    - [Hello World with Recoil \& recoil-ext](#hello-world-with-recoil--recoil-ext)
  - [Features](#features)
    - [🏢 Entity Adapter](#-entity-adapter)
    - [💾 IndexedDB Persistence](#-indexeddb-persistence)
    - [🐛 Debug Observer](#-debug-observer)
  - [Usage \& Examples](#usage--examples)
    - [Entity Adapter Example](#entity-adapter-example)
    - [IndexedDB Persistence Example](#indexeddb-persistence-example)
    - [Debug Observer Example](#debug-observer-example)
  - [API Reference](#api-reference)
    - [1. Entity Adapter API](#1-entity-adapter-api)
      - [`createEntityAdapter<T, K, Id>`](#createentityadaptert-k-id)
    - [2. IndexedDB Effect API](#2-indexeddb-effect-api)
      - [`idbEffect<T>`](#idbeffectt)
    - [3. Debug Observer API](#3-debug-observer-api)
      - [`DebugObserver`](#debugobserver)
  - [Best Practices](#best-practices)
  - [TypeScript Support](#typescript-support)
  - [Project Structure Guide](#project-structure-guide)
  - [Contributing](#contributing)
  - [License](#license)
  - [Related Projects](#related-projects)

---

## What is Recoil?

[Recoil](https://recoiljs.org/) is a **state management library for React**, introduced by Facebook. It provides:

- **Atoms**: Your basic units of state. Think "global variables" within Recoil, but only subscribed components re-render when changes happen.
- **Selectors**: Pure functions that derive or compute data from atoms (or other selectors).
- **RecoilRoot**: A provider component that wraps your app, ensuring Recoil state is available to all child components.

**Recoil** offers a simple, React-first approach—no huge boilerplate, no complicated wiring like Redux. But as your app scales, you may need specialized helpers like **normalized entity adapters** or **easy persistence** to local storage/IndexedDB. Enter **recoil-ext**!

---

## Overview of recoil-ext

**recoil-ext** extends Recoil with:

1. **🏢 Entity Adapter**: Store and manage collections of data (e.g., tasks, users) in a normalized format (`ids + entities`) with type-safe CRUD operations.
2. **💾 IndexedDB Persistence**: Persist your atoms automatically in IndexedDB. On page load, we restore the data from the database.
3. **🐛 Debug Observer**: A development helper that logs all atom/selector updates to the console—ideal for debugging or learning how your state changes over time.

---

## Installation

**Peer Dependencies**: You must have `recoil` and `react` installed.

```bash
# If you're using npm
npm install recoil-ext recoil react

# If you're using yarn
yarn add recoil-ext recoil react

# If you're using pnpm
pnpm add recoil-ext recoil react

# ... etc.
```

> **Why not include `recoil` or `react`?**
> We keep them as peer dependencies to avoid bundling multiple copies if your project already has them installed.

---

## Quick Start

### Hello World with Recoil & recoil-ext

This **quick start** shows a minimal usage of Recoil plus the Debug Observer (one of recoil-ext's tools) to see state changes in action.

1. **Wrap your app in `<RecoilRoot>`**:

   ```tsx
   // src/index.tsx
   import React from 'react';
   import { createRoot } from 'react-dom/client';
   import { RecoilRoot } from 'recoil';
   import App from './App';

   createRoot(document.getElementById('root')!).render(
     <RecoilRoot>
       <App />
     </RecoilRoot>
   );
   ```

2. **Install & Import Debug Observer**:

   ```tsx
   // src/App.tsx
   import React from 'react';
   import { atom, useRecoilState } from 'recoil';
   import { DebugObserver } from 'recoil-ext';

   // A simple Recoil atom
   const countAtom = atom<number>({
     key: 'countAtom',
     default: 0,
   });

   function App() {
     const [count, setCount] = useRecoilState(countAtom);
     return (
       <div>
         {/* Show debug logs only in development */}
         {process.env.NODE_ENV === 'development' && <DebugObserver />}
         <h1>Hello Recoil!</h1>
         <p>Count: {count}</p>
         <button onClick={() => setCount(count + 1)}>Increment</button>
       </div>
     );
   }

   export default App;
   ```

3. **Run & watch the console**. Whenever you increment the counter, the Debug Observer logs the updated atom value in dev mode.

---

## Features

### 🏢 Entity Adapter

An **entity adapter** provides a structured way to store collections of data in your Recoil store:

- Use `entities` in a dictionary/record format keyed by ID.
- Maintain an `ids` array for ordering or iteration.
- Gain easy CRUD operations: add/update/remove/upsert, etc.

**Why is this helpful?**
When dealing with a list of items (e.g., tasks, users, or products), normalized storage helps you avoid duplicates and quickly perform updates.

### 💾 IndexedDB Persistence

The **idbEffect** automatically syncs an atom's state to IndexedDB. It reads the saved state on atom initialization and writes new data when changes occur.

**Use Cases**:

- Offline preferences or data caching.
- Storing user settings.
- Large data sets that exceed localStorage limits.

### 🐛 Debug Observer

A **development helper** for logging atom/selector changes to the console in real-time. Perfect for debugging or learning how your app's state evolves.

---

## Usage & Examples

### Entity Adapter Example

**Scenario**: A task manager with simple todos. Each todo has an `id`, `text`, and `completed` status.

1. **Create an adapter**:

   ```ts
   import { createEntityAdapter } from 'recoil-ext';

   interface Todo {
     id: string;
     text: string;
     completed: boolean;
   }

   // "todoState" is the Recoil atom key
   // "idKey" is the property we use as the unique ID
   export const todoAdapter = createEntityAdapter<Todo, 'id'>({
     key: 'todoState',
     idKey: 'id',
   });
   ```

2. **Use it in a component**:

   ```tsx
   import React from 'react';
   import { todoAdapter } from './todoAdapter';

   function TodoList() {
     // Retrieve all todos from Recoil
     const todos = todoAdapter.useAllEntities();

     // Get entity actions (CRUD)
     const { addOne, removeOne, updateOne } = todoAdapter.createUseEntityActions()();

     function addTodo() {
       addOne({ id: Date.now().toString(), text: 'New Task', completed: false });
     }

     function toggleCompleted(id: string, completed: boolean) {
       updateOne({ id, changes: { completed } });
     }

     return (
       <div>
         <button onClick={addTodo}>Add Todo</button>
         <ul>
           {todos.map((todo) => (
             <li key={todo.id}>
               <input
                 type="checkbox"
                 checked={todo.completed}
                 onChange={(e) => toggleCompleted(todo.id, e.target.checked)}
               />
               {todo.text}
               <button onClick={() => removeOne(todo.id)}>Delete</button>
             </li>
           ))}
         </ul>
       </div>
     );
   }

   export default TodoList;
   ```

3. **Access a single entity** (e.g., for a detail page or sub-component):

   ```tsx
   function TodoItem({ id }: { id: string }) {
     const useOneTodo = todoAdapter.createUseOneEntity();
     const todo = useOneTodo(id);

     if (!todo) return null;
     return <div>{todo.text}</div>;
   }
   ```

### IndexedDB Persistence Example

1. **Create a persisted atom**:

   ```ts
   import { atom } from 'recoil';
   import { idbEffect } from 'recoil-ext';

   interface UserSettings {
     theme: 'light' | 'dark';
     notifications: boolean;
   }

   export const settingsAtom = atom<UserSettings>({
     key: 'settingsAtom',
     default: {
       theme: 'light',
       notifications: true,
     },
     effects: [
       idbEffect({
         dbName: 'MyAppDB',
         storeName: 'settings',
         key: 'userSettings',
       }),
     ],
   });
   ```

2. **Use it**:

   ```tsx
   import React from 'react';
   import { useRecoilState } from 'recoil';
   import { settingsAtom } from './settingsAtom';

   function Settings() {
     const [settings, setSettings] = useRecoilState(settingsAtom);

     function toggleTheme() {
       setSettings((prev) => ({
         ...prev,
         theme: prev.theme === 'light' ? 'dark' : 'light',
       }));
     }

     return (
       <div>
         <p>Current Theme: {settings.theme}</p>
         <button onClick={toggleTheme}>Toggle Theme</button>
       </div>
     );
   }

   export default Settings;
   ```

3. **All changes persist** across page refreshes. On next load, `idbEffect` restores the last saved state from IndexedDB.

### Debug Observer Example

```tsx
import React from 'react';
import { RecoilRoot } from 'recoil';
import { DebugObserver } from 'recoil-ext';

function AppRoot() {
  return (
    <RecoilRoot>
      {process.env.NODE_ENV === 'development' && <DebugObserver />}
      <MainApp />
    </RecoilRoot>
  );
}

export default AppRoot;
```

Whenever an atom is updated, the Debug Observer logs a message in the console, showing the atom key and new value.

---

## API Reference

### 1. Entity Adapter API

#### `createEntityAdapter<T, K, Id>`

Creates a normalized store for managing collections of entities.

```ts
function createEntityAdapter<
  T extends { [K in keyof T]: T[K] },
  K extends keyof T,
  Id extends string | number = T[K] extends string | number ? T[K] : never,
>(options: {
  key: string;                              // Unique Recoil atom key
  idKey: K;                                 // Property to use as ID
  initialState?: ReadonlyArray<T> | T;      // Optional starting data
  selectId?: (entity: T) => Id;             // Optional custom ID selector
  sortComparer?: (a: T, b: T) => number;    // Optional sort function
}): EntityAdapter<T, Id>
```

Returns an adapter with these methods:

```ts
interface EntityAdapter<T, Id> {
  // Get the initial normalized state
  getInitialState: () => EntityState<T, Id>;

  // The underlying Recoil atom
  entityAtom: RecoilState<EntityState<T, Id>>;

  // Hook to get all entities as an array
  useAllEntities: () => ReadonlyArray<T>;

  // Create a hook to get one entity by ID
  createUseOneEntity: () => (id: Id) => T | undefined;

  // Create hooks for CRUD operations
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

// Shape of the normalized state
interface EntityState<T, Id> {
  readonly ids: ReadonlyArray<Id>;
  readonly entities: {
    readonly [id: string]: T;
  };
}
```

### 2. IndexedDB Effect API

#### `idbEffect<T>`

Creates an atom effect that automatically persists atom state to IndexedDB.

```ts
function idbEffect<T>(options: {
  dbName: string;     // Name of the IndexedDB database
  storeName: string;  // Name of the object store
  key: string;        // Unique key for the stored value
}): AtomEffect<T>
```

**Behavior**:

- On initial mount: Reads stored value from IndexedDB
- On atom updates: Writes new value to IndexedDB
- Handles database initialization and upgrades automatically
- Creates object store if it doesn't exist

**Error Handling**:

- Logs errors to console in development
- Gracefully falls back to default atom value if read fails
- Continues operation even if persistence fails

### 3. Debug Observer API

#### `DebugObserver`

A React component that logs Recoil state changes to the console.

```ts
function DebugObserver(): React.ReactNode
```

**Features**:

- Logs only modified atoms/selectors
- Shows previous and current values
- Automatically updates on any state change

**Console Output**:

```ts
interface DebugOutput {
  key: string;        // Atom/selector identifier
  loadable: {         // Recoil loadable object
    state: 'hasValue' | 'loading' | 'hasError';
    contents: unknown;  // The actual value
  };
}
```

**Best Practice**: Only include in development:

```tsx
{process.env.NODE_ENV === 'development' && <DebugObserver />}
```

---

## Best Practices

1. **Normalize lists**: If you have multiple collections or references between them, an Entity Adapter can reduce complexity.
2. **One DB per app**: Typically, one IndexedDB database is enough; create multiple stores for different data categories.
3. **Load data first**: For server data, fetch it outside, then call `setAll` or `addMany` in your adapter once it's loaded. Keep networking code separate from local state management.
4. **Use Debug Observer selectively**: Only enable it in dev mode to avoid cluttering production logs.

---

## TypeScript Support

**recoil-ext** is written in TypeScript with **strict** settings:

- **Compile-time** checks for entity shapes and ID fields.
- **Readonly** defaults to encourage immutability.
- **Full autocompletion** in modern IDEs.

You can still use **recoil-ext** in plain JavaScript; TS definitions will just enhance editor IntelliSense.

---

## Project Structure Guide

Example directory layout:

```
my-app/
  ├─ src/
  │   ├─ recoil/
  │   │   ├─ todoAdapter.ts
  │   │   ├─ settingsAtom.ts
  │   │   └─ ...
  │   ├─ components/
  │   │   ├─ TodoList.tsx
  │   │   ├─ Settings.tsx
  │   │   └─ ...
  │   ├─ App.tsx
  │   └─ index.tsx
  ├─ package.json
  └─ tsconfig.json
```

**Tips**:

- Define your **adapters** and **persisted atoms** in a dedicated `recoil/` folder (or similar).
- Import them in your **UI** components.
- Place `<RecoilRoot>` near the root of your app, typically in `index.tsx` or a top-level `AppRoot` component.

---

## Contributing

We love your contributions! If you have an idea or fix:

1. **Fork** the repository.
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`).
3. **Commit** your changes (`git commit -m "Add some amazing feature"`).
4. **Push** to your branch (`git push origin feature/amazing-feature`).
5. **Open** a Pull Request.

Please ensure any new feature includes tests or updated documentation.

---

## License

[MIT](./LICENSE) © [Your Name or Organization]

This license grants you permission to modify, redistribute, or use recoil-ext in commercial or open-source projects. Have fun!

---

## Related Projects

- [**Recoil**](https://recoiljs.org/) – The core state management library for React.
- [**NGRX Entity**](https://ngrx.io/guide/entity/adapter) – Inspiration for the entity adapter concept in Angular.
- [**Redux Toolkit**](https://redux-toolkit.js.org/) – Another popular approach to entity adapters.
- [**IDB**](https://github.com/jakearchibald/idb) – A friendly library for IndexedDB if you want advanced usage or extra DB features.
- [recoil-ext](#recoil-ext)
  - [Table of Contents](#table-of-contents)
  - [What is Recoil?](#what-is-recoil)
  - [Overview of recoil-ext](#overview-of-recoil-ext)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
    - [Hello World with Recoil \& recoil-ext](#hello-world-with-recoil--recoil-ext)
  - [Features](#features)
    - [🏢 Entity Adapter](#-entity-adapter)
    - [💾 IndexedDB Persistence](#-indexeddb-persistence)
    - [🐛 Debug Observer](#-debug-observer)
  - [Usage \& Examples](#usage--examples)
    - [Entity Adapter Example](#entity-adapter-example)
    - [IndexedDB Persistence Example](#indexeddb-persistence-example)
    - [Debug Observer Example](#debug-observer-example)
  - [API Reference](#api-reference)
    - [1. Entity Adapter API](#1-entity-adapter-api)
      - [`createEntityAdapter<T, K, Id>`](#createentityadaptert-k-id)
    - [2. IndexedDB Effect API](#2-indexeddb-effect-api)
      - [`idbEffect<T>`](#idbeffectt)
    - [3. Debug Observer API](#3-debug-observer-api)
      - [`DebugObserver`](#debugobserver)
  - [Best Practices](#best-practices)
  - [TypeScript Support](#typescript-support)
  - [Project Structure Guide](#project-structure-guide)
  - [Contributing](#contributing)
  - [License](#license)
  - [Related Projects](#related-projects)

  - [Project Structure Guide](#project-structure-guide)
  - [Contributing](#contributing)
  - [License](#license)
  - [Related Projects](#related-projects)
