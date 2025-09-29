# ProtantrixFE

This folder contains the front-end React / React Native application sources. Below are the main folders and how they're organized.

## Folder overview

- `components/`
	- Reusable UI components used across the app (buttons, inputs, lists, cards, headers, footers, etc.). Keep components small and focused. Prefer props-driven components that are easy to test and reuse.
	- Suggested structure inside `components/`:
		- `ComponentName/`
			- `index.js` (component entry)
			- `styles.js` (component styles)
			- `__tests__/` (unit tests)

- `pages/`
	- Top-level view/screens that represent routes or major screens in the app (Home, Settings, Profile, etc.). pages compose `components` and handle page-level state, navigation, and data-fetching.
	- Keep pages slim by moving UI into `components` and side-effects into hooks or helper modules.

## Recommended conventions

- Naming: use PascalCase for component and page directory names (`LoginForm`, `UserProfile`). Use camelCase for filenames that export helper functions.
- Props: prefer explicit props over implicit globals. Use defaultProps (or default parameters) where appropriate.
- Styling: colocate styles with the component. Prefer StyleSheet (React Native) or CSS modules (web) depending on platform.
- Tests: add at least one smoke test for pages and unit tests for key components.

## How to add a new Page or Component

1. Create a new folder under `components/` or `pages/` named after the feature.
2. Add the component or page entry file (`index.js`) and a `styles.js`.
3. Export the component as the default export from `index.js` so imports are simple: `import MyComp from '../components/MyComp'`.
4. Add tests under `__tests__/` and run the test suite.

## Run & develop (if this project is an Expo app)

From the project root (where `package.json` is located):

```powershell
npm install
npx expo start
```

This README focuses on folder usage. For more setup and run details, see the top-level README or the `package.json` scripts.

---
If you'd like, I can:
- Scaffold a component template and a page template file.
- Add example components and pages that demonstrate conventions.

