# 🎨 Style Guide

Specify:

- UI/UX design system
- Code style and linting rules
- Naming conventions
- Accessibility standards

## Modal Dialogs

- All modal dialogs must use the shared `src/components/ui/Modal.tsx` component.
- This ensures accessibility, consistent styling, and a unified user experience.
- Do not implement custom modals in feature modules; always use the shared component.

## Typography & Section Headers

- Use `font-ui` for all text, with `text-xl font-semibold` for section headers (see globals.css).
- Section headers should be visually distinct and consistent across the app.

## Grid Alignment for Option Rows

- Use a 4-column grid for option rows in enrichment/profile UIs: [Remove + Name] | [Dropdown] | [Label] | [Switch + Yes/No].
- Ensure all columns have consistent min-widths and alignment for a professional, tidy look.
- Use `truncate` for long skill names to prevent overflow.

## Apple-Inspired Toggle Switches

- Use `@headlessui/react` Switch for Yes/No toggles.
- Style with larger size, border, shadow, and distinct color for active state (e.g., `bg-green-600`).
- Place toggles in the rightmost column for easy scanning.

## Toast Notification Utility

- Use the `.toast` class for all feedback messages.
- Variants: `.toast-success`, `.toast-error`, `.toast-info` for color.
- Placement: `.toast-top`, `.toast-bottom`, `.toast-right`, `.toast-left`, `.toast-absolute`, `.toast-fixed`.
- Example: `<div class="toast toast-success toast-absolute toast-top toast-right">Success!</div>`
- Toasts should appear near the triggering action/button for best UX.

## Example Usage

```jsx
<div className="toast toast-success toast-absolute toast-top toast-right">
  Profile updated!
</div>
```

<!-- Replace this with your style and design standards. -->
