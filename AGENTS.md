# Project Rules

## Frontend Reuse
- For any new page or UI, first check `frontend/src/components/common`.
- Prefer shared components over raw duplicated MUI markup.
- Reuse these first when applicable:
  - `AppButton`
  - `AppTextField`
  - `AppSelect`
  - `AppDropdown`
  - `AppCard`
  - `ImageCard`
  - `ContentCard`
  - `AppSearchField`
  - `AppDrawer`
  - `FilterPanel`
  - `AppPagination`
  - `AppFooter`

## Page Rules
- Keep page files focused on page layout and feature logic.
- Move reusable UI into shared components instead of repeating it in pages.
- If a suitable common component does not exist, create one only when reuse is likely.

## Styling Rules
- Follow the shared MUI theme in `frontend/src/theme/theme.ts`.
- Prefer theme-based styles and shared wrappers instead of page-specific one-off input/button styles.

## API Rules
- Use Redux Toolkit and RTK Query for frontend API integration.
- Avoid direct `fetch` in pages when the API belongs in shared store services.

## General
- Avoid duplicate components with overlapping purpose.
- Prefer small, reusable, composable components.
- Keep implementations simple and token-efficient.
