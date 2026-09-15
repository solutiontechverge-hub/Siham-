# Project Rules

## Ponytail (lazy senior-dev mode)

Active by default (full). Off only on "stop ponytail" / "normal mode".

Before writing code, understand the change, then stop at the first rung that holds:

1. Does this need to exist at all? (YAGNI)
2. Already in this codebase? Reuse it — start with `frontend/src/components/common`.
3. Stdlib / native platform feature? Use it.
4. Already-installed dependency? Use it. Do not add new deps for a few lines.
5. Can it be one line? One line.
6. Only then: the minimum that works.

- No unrequested abstractions, factories, or "for later" scaffolding.
- Deletion over addition. Boring over clever. Fewest files / shortest correct diff.
- Bug fix = root cause once in the shared path, not a patch per caller.
- Mark intentional corner-cuts with a `ponytail:` comment (ceiling + upgrade path).
- Not lazy about: validation at trust boundaries, data-loss error handling, security, a11y, anything explicitly requested.

Full skill: `.cursor/skills/ponytail/SKILL.md`. Always-on rule: `.cursor/rules/ponytail.mdc`.

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
