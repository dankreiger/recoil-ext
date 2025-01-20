# My NPM Package

## Installation

```bash
bun add recoil-ext
```

## Usage

```typescript
import { greet } from 'recoil-ext';

console.log(greet('World')); // Hello, World!
```

## Development

1. Install dependencies: `bun install`
2. Run tests: `bun test`
3. Format code: `bun run format`
4. Lint code: `bun run lint`
5. Build: `bun run build`

## Release

This package uses release-it for versioning and publishing. To create a new release:

1. Run `bun run release`
2. Follow the prompts to choose the version and generate the changelog

## License

MIT
