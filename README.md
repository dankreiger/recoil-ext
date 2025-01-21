# 🔄 Recoil Utils

[![npm version](https://img.shields.io/npm/v/@your-org/recoil-utils)](https://www.npmjs.com/package/@your-org/recoil-utils)
[![Build Status](https://img.shields.io/github/workflow/status/your-org/recoil-utils/CI)](https://github.com/your-org/recoil-utils/actions)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@your-org/recoil-utils)](https://bundlephobia.com/package/@your-org/recoil-utils)
[![Coverage Status](https://coveralls.io/repos/github/your-org/recoil-utils/badge.svg?branch=main)](https://coveralls.io/github/your-org/recoil-utils?branch=main)
[![License](https://img.shields.io/npm/l/@your-org/recoil-utils)](https://github.com/your-org/recoil-utils/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

> Production-ready utilities for [Recoil](https://recoiljs.org/) that make state management a breeze 🌊

## ✨ Features

- 🏢 **Entity Adapter**: Normalized state management inspired by Redux Toolkit & NgRx
- 💾 **IndexedDB Effect**: Zero-config persistence with IndexedDB
- 🐛 **Debug Observer**: Real-time state tracking for development
- 📦 **Tree-Shakeable**: Import only what you need
- 💪 **Type-Safe**: Written in TypeScript with strict types
- 🧪 **Well Tested**: 100% test coverage
- 📚 **Documented**: Comprehensive API documentation and examples

## 📦 Installation

```bash
# Using npm
npm install @your-org/recoil-utils recoil

# Using yarn
yarn add @your-org/recoil-utils recoil

# Using pnpm
pnpm add @your-org/recoil-utils recoil

# Using bun
bun add @your-org/recoil-utils recoil
```

### Requirements

- React ≥16.8.0
- Recoil ≥0.7.0
- TypeScript ≥4.7.0 (for TypeScript users)

## 🚀 Quick Start

### Entity Adapter

```typescript
// 1️⃣ Define your entity
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

// 2️⃣ Create the adapter
const todoAdapter = createEntityAdapter<Todo, 'id'>({
  key: 'todos',
  idKey: 'id',
  sortComparer: (a, b) => b.createdAt - a.createdAt // Optional
});

// 3️⃣ Use in your components
function TodoList() {
  const todos = todoAdapter.useAllEntities();
  const { addOne, removeOne, updateOne } = todoAdapter.createUseEntityActions()();

  return (
    <div>
      <NewTodoForm onAdd={addOne} />
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onUpdate={updateOne}
          onRemove={removeOne}
        />
      ))}
    </div>
  );
}

// 4️⃣ Efficient single entity access
function TodoItem({ id }: { id: string }) {
  const useOneTodo = todoAdapter.createUseOneEntity();
  const todo = useOneTodo(id);

  if (!todo) return null;
  return <TodoDisplay todo={todo} />;
}
```

### IndexedDB Persistence

```typescript
// 1️⃣ Define your state
interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
}

// 2️⃣ Create persisted atom
const settingsAtom = atom<Settings>({
  key: 'settings',
  default: {
    theme: 'light',
    fontSize: 16
  },
  effects: [
    idbEffect({
      dbName: 'MyApp',
      storeName: 'settings',
      key: 'userSettings'
    })
  ]
});

// 3️⃣ Use anywhere in your app
function ThemeToggle() {
  const [settings, setSettings] = useRecoilState(settingsAtom);

  return (
    <button
      onClick={() => setSettings(prev => ({
        ...prev,
        theme: prev.theme === 'light' ? 'dark' : 'light'
      }))}
    >
      Current Theme: {settings.theme}
    </button>
  );
}
```

## 📖 Advanced Usage

### Entity Adapter Patterns

#### Optimistic Updates

```typescript
const { updateOne } = todoAdapter.createUseEntityActions()();

async function toggleTodo(id: string) {
  // Optimistically update UI
  updateOne({ id, changes: { completed: true } });

  try {
    await api.updateTodo(id);
  } catch (error) {
    // Revert on failure
    updateOne({ id, changes: { completed: false } });
    showError(error);
  }
}
```

#### Batch Operations

```typescript
const { addMany, removeMany } = todoAdapter.createUseEntityActions()();

// Add multiple todos
addMany([
  { id: '1', text: 'First', completed: false },
  { id: '2', text: 'Second', completed: false }
]);

// Remove multiple todos
removeMany(['1', '2']);
```

### IndexedDB Effect Options

```typescript
idbEffect({
  dbName: 'MyApp',
  storeName: 'settings',
  key: 'userSettings',
  // Optional error handling
  onError: (error) => {
    console.error('Storage failed:', error);
    // Fallback behavior
  }
});
```

## 🔍 API Reference

### Entity Adapter

```typescript
interface EntityAdapter<T, Id extends string | number> {
  entityAtom: RecoilState<EntityState<T, Id>>;
  getInitialState: () => EntityState<T, Id>;
  useAllEntities: () => ReadonlyArray<T>;
  createUseOneEntity: () => (id: Id) => T | undefined;
  createUseEntityActions: () => () => EntityActions<T, Id>;
}

interface EntityActions<T, Id> {
  addOne: (entity: T) => void;
  addMany: (entities: ReadonlyArray<T>) => void;
  setAll: (entities: ReadonlyArray<T>) => void;
  updateOne: (update: { id: Id; changes: Partial<T> }) => void;
  upsertOne: (entity: T) => void;
  removeOne: (id: Id) => void;
  removeMany: (ids: ReadonlyArray<Id>) => void;
}
```

## 🔧 Troubleshooting

### Common Issues

#### IndexedDB in Private Browsing

```typescript
idbEffect({
  ...options,
  onError: () => {
    // Fallback to memory-only storage
    console.warn('Storage unavailable, using memory only');
  }
});
```

#### Performance Optimization

```typescript
// ❌ Avoid: Unnecessary re-renders
function BadComponent() {
  const todos = todoAdapter.useAllEntities();
  return <div>{todos.length}</div>;
}

// ✅ Better: Use selector for specific data
function GoodComponent() {
  const count = useRecoilValue(todoAdapter.selectTotal);
  return <div>{count}</div>;
}
```

## 🧪 Testing

```typescript
// Example test with Jest
describe('TodoList', () => {
  it('adds a new todo', () => {
    const { result } = renderRecoilHook(() => {
      const todos = todoAdapter.useAllEntities();
      const { addOne } = todoAdapter.createUseEntityActions()();
      return { todos, addOne };
    });

    act(() => {
      result.current.addOne({
        id: '1',
        text: 'Test Todo',
        completed: false
      });
    });

    expect(result.current.todos).toHaveLength(1);
  });
});
```

## 📈 Browser Support

- Chrome ≥ 76
- Firefox ≥ 68
- Safari ≥ 12.1
- Edge ≥ 79

## 🤝 Contributing

We love your input! See our [Contributing Guide](CONTRIBUTING.md) for ways to get started.

### Development Setup

```bash
# Clone the repo
git clone https://github.com/your-org/recoil-utils.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build
```

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## 📄 License

MIT © [Your Organization]

## 🙏 Acknowledgments

- [Redux Toolkit](https://redux-toolkit.js.org/) for entity adapter inspiration
- [Recoil](https://recoiljs.org/) team for the amazing state management library
- [NgRx](https://ngrx.io/) for additional patterns and ideas
