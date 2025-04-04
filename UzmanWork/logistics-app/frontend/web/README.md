# Project Structure

We use modular architecture to organize our React project. The project consists of Core module (`common`) and
feature-specific modules (e.g., `integrations`, `dashboard`) and Pages (`pages`) entry points.

Each module is designed to encapsulate specific functionalities and components, ensuring a clean, scalable, and
maintainable codebase. Modules should be self-contained and reuse only the necessary components and utilities from
the `common` module. If a module does not explicitly export something it should not be used outside the module.

## Core Module: `common`

The `common` module is the backbone of the project, providing shared components, utilities, and types.

### Components Package

- **Purpose**: Contains globally reusable components. The module should introduce a component library reusable across
  the application.
- **Structure**:
  - Each component is in its own file, e.g., `ComponentA.tsx`.
  - Components with subcomponents or other dependencies like utils, hooks, types, have a root package,
    e.g., `ComponentC` with and index file that explicitly defines all exported elements.

### Utilities Package

- **Purpose**: Hosts common utility functions. E.g.: time.tsx, text.tsx, etc.
- **Export**: Aggregated and exported through an `index.tsx` file.

### Types Package

- **Purpose**: Stores shared TypeScript type definitions. E.g.: `CommonType.tsx`. We prefer using interfaces over types
  where possible.
- **Export**: Aggregated and exported via an `index.tsx` file.

## Feature-Specific Modules

Modules, such as `integrations` and `dashboard`, contain components, hooks, types, constants, utilities specific to
individual application features. They must encapsulate all internal functionalities and dependencies and only export
page components that are used in the application routing. All reused components, utilities, and types should be moved
to the `common` module.

### `Feature` Module Example

#### Components Package

- **Specificity**: Contains components specific to the `Feature` module.
- **Structure**: Mirrors that of the `common` components package.

#### Module-Specific Assets

- **Files**: Includes `types.tsx`, `utils.tsx`, `hooks.tsx` specific to `Feature`.

#### Module Index

- **Purpose**: Acts as the exporting hub for the module's Pages.

#### Storybook Stories and Tests

- **Storybook**: Dedicated sub-package for visual testing and component documentation.
- **Tests**: Module-specific tests are stored in a `tests` sub-module.

## Website Entry Points: `pages`

- **Website Pages**: Main components like `PageA1.tsx` or `PageA2.tsx` serve as entry points. Pages should be grouped by
  a feature or logically as they are displayed on the website and exported through an `index.tsx` file.

## Code Conventions

- **Naming Conventions**: Use PascalCase for components Component.tsx/Component(folder) and camelCase for everything
  else.
- **Functions**: Prefer function declarations over arrow functions.
- **Export Aggregation**: Utilizes `index.tsx` files for cleaner import statements.

## Project Hierarchy Example

```plaintext
/
├── common/
│   ├── components/
│   │   ├── index.tsx
│   │   ├── ComponentA.tsx
│   │   └── ComponentB/
│   │       ├── index.tsx
│   │       ├── components/
│   │       │   └── ComponentC.tsx
│   │       ├── types.tsx
│   │       ├── utils.tsx
│   │       ├── hooks.tsx
│   │       ├── consts.tsx
│   │       ├── ComponentB.tsx
│   │       ├── stories
│   │       │   └── ComponentB.stories.tsx
│   │       └── tests
│   │           └── ComponentB.test.tsx
│   ├── utils/
│   │   ├── commonFunction.tsx
│   │   └── index.tsx
│   ├── tests/
│   │   ├── utils.tsx
│   │   └── index.tsx
│   └── types/
│       ├── CommonType.tsx
│       └── index.tsx
└── features/
    └── featureA/
        ├── components/
        │   └── ... (similar to common)
        ├── types.tsx
        ├── utils.tsx
        ├── hooks.tsx
        └── index.tsx
└── pages/
    └── pageA/
        ├── PageA1.tsx
        ├───PageA2.tsx
        └── index.tsx
```

# Storybook

[Storybook](https://storybook.js.org) is a tool for developing frontend components in isolation. It allows us to iterate
on the frontend quicker without the need to run the whole app. It also allows us to mock out error states and corner
cases. It also helps with component separation and facilities testing.

### Running Storybook

`yarn workspace web storybook`  
It will print a url on which you can access it.

### Writing stories

A [Story](https://storybook.js.org/docs/react/writing-stories/introduction) is a certain state of a UI component. They
live under `frontend/web/src/stories`.  
There's a bit of boilerplate to it but the basic structure is this:

1. The `Meta` object defines the basic properties of a story. The UI component is defined here as well as any decorators
   and other arguments.
2. `Decorators` are like wrappers for a component. These handle any higher state which is required, like recoil, auth,
   etc.
3. `msw` - Mock Service Worker. This is a library for mocking out API calls. There's examples of how to define mocked
   APIs in `frontend/web/src/mocks/`. Any API calls required for the component should be mocked out.
4. A list of `Story` objects. Each of these define a separate state of the component, like an errored state, pending
   state etc.

Any components which require a state setter to be passed in should get a wrapper like
in `stories/timeline/TimelineControls.stories.tsx>TimelineControlsWithSetter`
