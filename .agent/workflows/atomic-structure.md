---
description: Create and enforce Atomic Design folder structure for components
---
# Atomic Design Folder Structure

When creating new components or organizing files, follow this Atomic Design structure strictly.

## 1. General Structure Rules

All components must reside in `src/components/` under one of the following categories:

-   **atoms**: Smallest, indivisible elements (Buttons, Inputs, Icons).
-   **molecules**: Groups of atoms functioning together (Form fields, NavLinks).
-   **organisms**: Complex sections or distinct parts of an interface (Headers, Footers, Hero sections).
-   **templates**: Page layouts without specific content.
-   **pages**: Full page implementations connecting templates to data.

## 2. Component File Structure

Every component must have its own directory named exactly like the component (PascalCase). Inside, separate logic, styles, and types into distinct files.

**Example for a component `MyComponent`:**

```text
MyComponent/
├── MyComponent.tsx        # Logic, Hooks, Render
├── MyComponent.styles.ts  # Styles object (Tailwind classes + inline styles)
├── MyComponent.types.ts   # Interfaces and Props
└── index.ts               # Export file (optional but recommended)
```

## 3. Page-Specific Components

If a component is **specific to a single page** (e.g., a Hero section unique to the Promotion page) and reusable nowhere else, create a `components` folder (or specific subfolder) **inside** that page's directory to keep it co-located.

**Example:**

```text
src/components/pages/PromocionPage/
├── PromocionPage.tsx
├── PromocionPage.styles.ts
├── Hero/                  # Page-specific Organism
│   ├── Hero.tsx
│   ├── Hero.styles.ts
│   └── Hero.types.ts
└── OtherSection/
    ├── OtherSection.tsx
    └── ...
```

## 4. Implementation Guidelines

-   **Logic (`.tsx`)**: tailored for Next.js 16 (React Server Components by default, use `"use client"` if interactivity is needed).
-   **Styles (`.styles.ts`)**: Export a const object containing Tailwind classes and inline styles matching Figma variables.
    ```typescript
    export const myComponentStyles = {
        container: "flex flex-col ...",
        title: "text-xl font-bold ...",
    };
    ```
-   **Types (`.types.ts`)**: Define `MyComponentProps` and any related interfaces.

## 5. Automation

// turbo
If asked to "create component X following atomic design", automatically create all 3 files (`.tsx`, `.styles.ts`, `.types.ts`) in the correct directory.
