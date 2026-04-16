# CollabLAN

## Project Overview

CollabLAN is an offline-first collaboration workspace built for hackathon teams and local network use cases.
The app combines a shared whiteboard, a collaborative code editor, team chat, file sharing, a progress tracker, and an in-browser AI assistant.
The core idea is simple.
If the internet is unavailable or unreliable, teammates on the same LAN should still be able to work together.
This repository contains the frontend code, local persistence helpers, peer-to-peer sync logic, routing setup, and UI system that make that possible.

This README is intentionally detailed.
It explains the repository folder by folder.
It also explains the responsibilities of the main files.
It is written so a teammate, reviewer, hackathon judge, or future maintainer can understand the project quickly.
The document focuses on what exists in the current codebase.
It does not describe features that are not implemented.

## What The App Does

At runtime, CollabLAN provides the following major capabilities:

1. A shared whiteboard for freehand drawing and simple shapes.
2. A Monaco-based code editor with language switching.
3. An offline AI code explainer for selected or full code.
4. A task board for tracking work status.
5. A local chat panel for messages between teammates.
6. A file-sharing panel that transfers files over peer-to-peer connections.
7. A workspace AI assistant that reads local tasks and recent chat.
8. Peer-to-peer synchronization across connected browsers.
9. IndexedDB persistence for tasks and chat history.
10. A retro pixel-art visual theme inspired by game menus.

## High-Level Technology Stack

The project uses a modern React stack with routing, animation, browser storage, local AI, and peer-to-peer networking.

- React 19 for component rendering.
- TypeScript for type safety.
- Vite for development and production builds.
- TanStack Router for file-based routing and app shell structure.
- Tailwind CSS v4 for utility-driven styling.
- Framer Motion for transitions and animated UI states.
- Monaco Editor through `@monaco-editor/react`.
- PeerJS for peer-to-peer data channels.
- IndexedDB through the `idb` package.
- WebLLM through `@mlc-ai/web-llm` for browser-side inference.
- Lucide icons for UI iconography.

## Repository Root

The root of the repository contains configuration, lock files, build settings, and the application source.
These files control how the app installs dependencies, builds, formats code, and runs locally.

### Root Files

`package.json`
Defines the project name, scripts, dependencies, and development dependencies.
This is the main metadata file for the app.
It tells contributors how to run development mode, production builds, formatting, and linting.

`package-lock.json`
Locks npm dependency versions.
This file ensures the same dependency tree can be reproduced across machines.

`bun.lockb`
Bun lock file.
It exists because the project can also be installed with Bun.
The main scripts shown in the repository still rely on the standard package configuration.

`bunfig.toml`
Small Bun configuration file.
Useful when Bun is used as the package manager or runtime helper.

`components.json`
Configuration related to the UI component generator or structure.
This is commonly used with shadcn-style component setups.
It helps define aliases and component directory conventions.

`tsconfig.json`
TypeScript configuration.
Controls module resolution, path aliases, JSX behavior, and compilation expectations.

`vite.config.ts`
Main Vite configuration file.
This is where plugins such as React, TanStack integration, Tailwind, and Cloudflare-related tooling are typically wired in.

`wrangler.jsonc`
Cloudflare-oriented configuration.
This suggests the app can be deployed or adapted to Cloudflare workflows.

`eslint.config.js`
ESLint configuration.
Defines linting behavior and code quality rules.

`.prettierrc`
Prettier configuration.
Controls code formatting style.

`.prettierignore`
Tells Prettier which files or directories to skip.

`.gitignore`
Defines which files and folders should not be tracked by git.
The current ignore list includes generated folders like `dist`, development metadata like `.wrangler`, and dependency folders like `node_modules`.

## Root Scripts

The scripts currently available in `package.json` are:

- `npm run dev`
- `npm run build`
- `npm run build:dev`
- `npm run preview`
- `npm run lint`
- `npm run format`

### Script Purpose

`dev`
Starts the Vite development server.
This is the main command used while building features or testing UI changes locally.

`build`
Creates a production build for both client and server output according to the current Vite and TanStack configuration.

`build:dev`
Runs a build using development mode.
Useful when someone wants build output with development semantics.

`preview`
Serves the built application locally for preview.

`lint`
Runs ESLint across the project.

`format`
Runs Prettier and rewrites files to match configured style rules.

## Main Source Folder

All application code lives in `src/`.
This folder is the heart of the repo.
It contains routing, components, hooks, utilities, storage helpers, peer synchronization logic, and the global stylesheet.

The top-level items inside `src/` are:

- `components/`
- `hooks/`
- `lib/`
- `routes/`
- `router.tsx`
- `routeTree.gen.ts`
- `styles.css`

## `src/router.tsx`

This file creates the TanStack router instance.
It imports the generated route tree from `routeTree.gen.ts`.
It also defines the default error component used when unexpected runtime errors happen.

### Important Responsibilities

1. Construct the router from the route tree.
2. Turn on scroll restoration.
3. Define a centralized error UI.
4. Expose `getRouter()` so the app can mount the router consistently.

### Error Handling

The default error UI is intentionally simple.
It shows an icon, a message, and controls for retrying or returning home.
This improves resilience without scattering error behavior across many files.

## `src/routeTree.gen.ts`

This file is generated.
It represents the route tree consumed by TanStack Router.
Contributors generally should not hand-edit this file.
Instead, route changes should happen in the `src/routes/` folder.

## `src/routes/`

This folder defines route components for the application.
The project currently uses a minimal route setup because the app behaves mostly like a single-screen dashboard.

### Route Files

`src/routes/__root.tsx`
Defines the root route.
This file provides:

- the HTML shell,
- metadata for the document head,
- stylesheet injection,
- not found handling,
- the `Outlet` for child routes.

It is responsible for the outer page structure.
It also sets metadata like page title, description, and social tags.

`src/routes/index.tsx`
Defines the home route.
This route renders the main `CollabLANApp` component.
In other words, this is where the collaboration dashboard actually starts.

## `src/styles.css`

This is the global stylesheet for the application.
It is one of the most important files in the repo because it defines:

- design tokens,
- theme variables,
- component-level utility classes,
- animation keyframes,
- the retro pixel-art visual direction.

### Styling Strategy

The file uses Tailwind v4 with custom CSS variables and layered utility classes.
Instead of relying only on default Tailwind primitives, it defines a design system specific to this project.
That gives the app a distinctive look.

### Key Things Defined Here

1. Theme variables mapped into Tailwind.
2. Color tokens such as `--background`, `--neon`, `--surface`, and teammate colors.
3. Font variables for display, body, and monospace text.
4. Component helper classes like `.panel-card`, `.panel-header`, `.tool-btn`, `.glass-input`, and `.pixel-window`.
5. The pixel-art atmosphere, including the moon, stars, clouds, and retro gradients.
6. Reusable animation keyframes like `pulse-dot`, `fade-up`, `slide-in-bottom`, and `shimmer`.

### Why This File Matters

Without `styles.css`, the app would still function logically, but the visual identity would be gone.
The file is not just decoration.
It encodes the design language of the product.

## `src/hooks/`

This folder currently contains shared React hooks.
The hook layer is small right now, but it exists to isolate reusable responsive or behavioral logic.

### `src/hooks/use-mobile.tsx`

This hook exposes `useIsMobile()`.
It uses `window.matchMedia` and a fixed breakpoint of `768`.
The hook returns a boolean that tells components whether the current viewport should be treated as mobile.

This file is useful because:

- it avoids duplicating media query logic,
- it keeps breakpoint detection consistent,
- it allows components to branch behavior in JavaScript when needed.

## `src/lib/`

This folder contains non-visual application logic.
These files are foundational.
They handle persistence, peer networking, utility functions, and local AI.

The current files are:

- `indexeddb.ts`
- `peer-sync.tsx`
- `utils.ts`
- `webllm.ts`

### `src/lib/utils.ts`

This file exports a single `cn()` helper.
It merges class names using `clsx` and `tailwind-merge`.

Purpose:

- simplify conditional class composition,
- avoid duplicate conflicting Tailwind classes,
- provide a standard utility used across UI components.

### `src/lib/indexeddb.ts`

This file manages local persistence in the browser.
It uses the `idb` package as a friendly wrapper around IndexedDB.

#### Database Name

The database is called `collablan`.

#### Object Stores

The current database schema includes:

1. `messages`
2. `tasks`
3. `files`

#### `messages` Store

Stores local chat history.
Each entry includes:

- `id`
- `sender`
- `text`
- `timestamp`
- `color`

An index named `by-time` is created on `timestamp`.
That makes ordered retrieval easier.

#### `tasks` Store

Stores local task board items.
Each task includes:

- `id`
- `title`
- `description`
- `status`
- `assignee`
- `lastEdited`
- `createdAt`
- `updatedAt`

An index named `by-status` is also created.

#### `files` Store

Stores file metadata and binary content shape definitions.
The schema supports:

- `id`
- `name`
- `size`
- `type`
- `data`
- `sender`
- `timestamp`

Important note:
The schema exists and helper functions exist, but the current `FileShare` component does not fully persist shared files into IndexedDB yet.
So the store is prepared for future expansion.

#### Exported Helpers

This file exports the following helpers:

- `getDB()`
- `saveMessage()`
- `getMessages()`
- `saveTask()`
- `getTasks()`
- `deleteTask()`
- `saveFile()`
- `getFiles()`

These functions centralize local data access.
That keeps storage logic out of UI components.

### `src/lib/peer-sync.tsx`

This file is the networking backbone of the app.
It creates a React context that exposes peer-to-peer collaboration capabilities to the component tree.

#### Main Role

It wraps the app in `PeerProvider`.
Components can then call `usePeerSync()` to access:

- the local peer ID,
- current room ID,
- peer connections,
- peer count,
- connection state,
- a `broadcast()` function,
- a `joinRoom()` function,
- a `subscribe()` message listener API,
- the current randomly chosen teammate identity.

#### Message Types

The `SyncMessage` union currently supports:

- `whiteboard-action`
- `whiteboard-clear`
- `whiteboard-undo`
- `code-update`
- `chat-message`
- `task-update`
- `task-delete`
- `file-share`
- `cursor-move`
- `peer-info`
- `sync-request`
- `full-sync`

Not every message type is fully exploited yet.
Some are scaffolding for richer sync later.

#### Identity Handling

The provider randomly selects one teammate identity for the current session from a hardcoded list:

- Aryan M
- Krishitha CS
- Devika Mourya

Each teammate also has a color token.

#### Session Room

A local room ID is created and cached in `sessionStorage` under `collablan-room`.
This is session-scoped, not long-term persistent like IndexedDB.

#### PeerJS Behavior

The provider creates a PeerJS instance with a generated peer ID.
It listens for:

- `open`
- `connection`
- `error`
- `disconnected`

The code then exposes helper functions to:

- open a connection to another peer,
- receive identity information,
- broadcast arbitrary sync messages to all open connections.

#### Why This File Matters

Without this file, the app would still work as a local single-user dashboard.
With it, the app becomes a collaborative LAN tool.

### `src/lib/webllm.ts`

This file powers local AI features.
It uses `@mlc-ai/web-llm`, which runs language models in the browser when WebGPU is available.

#### Model

The current model ID is:

`Qwen2.5-0.5B-Instruct-q4f16_1-MLC`

That means the app is optimized for a small, local, lightweight assistant rather than a cloud-scale model.

#### Core Exports

- `initWebLLM()`
- `getLoadProgress()`
- `isModelLoaded()`
- `isModelLoading()`
- `ensureWebLLMReady()`
- `explainCode()`
- `generateAISummary()`
- `chatWithWorkspaceAssistant()`

#### Model Lifecycle

The file stores the model engine in module scope.
It also tracks:

- whether the engine is loading,
- the current load progress.

This avoids repeated initialization.

#### `explainCode()`

This function builds a small prompt instructing the AI to explain a code snippet clearly and concisely.
It is used by the Monaco editor panel.

#### `generateAISummary()`

This function turns a list of tasks into a short AI summary.
It exists as a reusable building block for task reporting.

#### `chatWithWorkspaceAssistant()`

This is the richer assistant interface.
It combines:

- the user prompt,
- recent chat messages,
- current tasks,
- current user identity,
- peer count,
- recent assistant history.

It then constructs a multi-message prompt sequence for the local model.
That is what powers the AI assistant tab.

#### Current Limitation

WebLLM requires WebGPU support.
If the browser does not support `navigator.gpu`, the offline AI path gracefully fails.

## `src/components/`

This folder contains the app UI.
It includes the main shell component, feature panels, and the imported UI primitive library under `components/ui`.

The feature-level components are:

- `AIAssistant.tsx`
- `BottomLeftPanel.tsx`
- `Chat.tsx`
- `CodeEditorPanel.tsx`
- `CollabLANApp.tsx`
- `ConnectionStatus.tsx`
- `FileShare.tsx`
- `ProgressTracker.tsx`
- `Whiteboard.tsx`

### `src/components/CollabLANApp.tsx`

This is the top-level product UI for the home route.
It assembles the full collaboration dashboard.

#### Main Responsibilities

1. Wrap the entire interface in `PeerProvider`.
2. Render the hero header and product shell.
3. Arrange feature panels into the main dashboard grid.
4. Render the footer.
5. Provide the current retro pixel-art framing of the app.

#### Layout Composition

The dashboard includes:

- a top hero area,
- network and mode pills,
- a whiteboard area,
- a code editor area,
- a progress area,
- a bottom-left tabbed panel for chat, AI, and files.

This file is also where much of the visual personality is expressed.

### `src/components/ConnectionStatus.tsx`

This component is a compact status button plus a popover.
It exposes peer connectivity details to the user.

#### Features

- shows whether peer networking is ready,
- shows the current peer count,
- displays the local peer ID,
- lets the user copy that peer ID,
- lets the user paste another peer ID and connect,
- lists currently connected peers.

#### Data Source

Everything comes from `usePeerSync()`.
That includes `peerId`, `connections`, `peerCount`, `isConnected`, and `joinRoom()`.

This component is the user-facing window into the networking layer.

### `src/components/Whiteboard.tsx`

This component implements the drawing canvas.
It is a substantial interactive feature.

#### Supported Tools

- Pen
- Rectangle
- Circle
- Line
- Text

#### Local State

It stores:

- selected tool,
- selected color,
- recorded actions,
- whether the user is currently drawing,
- remote cursor positions.

#### Rendering Model

The component redraws canvas content from an actions array.
That means the canvas is not treated like a one-off bitmap.
Instead, drawing actions become the source of truth.

#### Sync Behavior

It listens for:

- `whiteboard-action`
- `whiteboard-clear`
- `whiteboard-undo`
- `cursor-move`

This allows collaborative whiteboard state to spread across peers.

#### Current Notes

The component includes cursor-related logic, but broadcast behavior for cursor movement is only lightly scaffolded.
That means the architecture anticipates richer live presence than is currently fully implemented.

### `src/components/CodeEditorPanel.tsx`

This component provides the collaborative code editor.
It is built around Monaco.

#### Features

- language switching,
- default sample content for multiple languages,
- remote synchronization of editor text,
- local AI explanation for selected or current code,
- animated explanation drawer.

#### Supported Languages

- JavaScript
- Python
- HTML
- CSS
- TypeScript

#### Sync Behavior

When local code changes, the component broadcasts a `code-update` message.
When a remote `code-update` arrives, it updates the correct language entry in local state.

This means the editor stores one code string per language in a state object.

#### AI Behavior

When the user clicks the AI explain button:

1. The component tries to read selected Monaco text.
2. If nothing is selected, it falls back to the full current editor content.
3. It ensures WebLLM is ready.
4. It sends the prompt through `explainCode()`.
5. It displays the returned explanation in an animated bottom drawer.

### `src/components/BottomLeftPanel.tsx`

This is a simple but important composition component.
It provides tab switching between three sub-features:

- Chat
- AI
- Files

The component itself does not own heavy business logic.
Its main job is to choose which panel is visible and provide the tab UI.

### `src/components/Chat.tsx`

This component handles the team chat experience.

#### Features

- loads previous local messages from IndexedDB,
- subscribes to remote chat sync messages,
- saves outgoing messages locally,
- broadcasts outgoing messages to peers,
- auto-scrolls to the bottom on updates.

#### Message Shape

Each message includes:

- `id`
- `sender`
- `text`
- `timestamp`
- `color`

#### Storage

Messages are written to and read from IndexedDB using:

- `saveMessage()`
- `getMessages()`

#### Networking

Messages are synced over P2P using `chat-message`.

### `src/components/FileShare.tsx`

This component handles peer-to-peer file sharing.

#### Features

- drag-and-drop file selection,
- click-to-browse file selection,
- file icon selection by MIME type,
- base64 conversion for transport,
- download links for received files.

#### Transfer Model

When a user selects a file:

1. The file is converted into an object URL locally for preview/download.
2. The binary data is converted to base64.
3. A `file-share` message is broadcast to peers.
4. On the receiving side, base64 is converted back into a Blob.
5. A new object URL is created so the file can be downloaded.

#### Important Implementation Note

This panel currently uses in-memory state for active shared files.
It does not persist file entries into IndexedDB even though database helpers exist.

### `src/components/ProgressTracker.tsx`

This component is the task board.

#### Features

- load tasks from IndexedDB,
- add new tasks,
- cycle task status,
- edit task notes,
- remove tasks,
- open a modal for task details,
- show overall completion percent.

#### Task Statuses

- `pending`
- `in-progress`
- `done`

#### Sync Behavior

It listens for:

- `task-update`
- `task-delete`

That means teammates can see updates on shared progress when connected over P2P.

#### Local Persistence

Tasks are persisted using:

- `getTasks()`
- `saveTask()`
- `deleteTask()`

### `src/components/AIAssistant.tsx`

This component is the conversational assistant tab.
It is separate from the code explainer panel.

#### What It Does

It gives the user a general-purpose workspace assistant that can:

- summarize ongoing work,
- suggest next steps,
- generate handoff notes,
- reason about tasks and recent discussion,
- respond to free-form prompts.

#### Context Sources

Before generating a reply, the assistant reads:

- stored tasks,
- stored recent chat messages,
- current user identity,
- current peer count,
- recent assistant conversation history.

That context is then sent into `chatWithWorkspaceAssistant()`.

#### Quick Prompt Buttons

The UI includes three prompt shortcuts:

- Daily standup
- Next steps
- Handoff notes

These are convenience entry points for common hackathon workflows.

## `src/components/ui/`

This folder contains reusable UI primitives.
Most of these are generic, framework-style wrappers and are not custom business logic.
They help standardize low-level patterns and reduce repeated code.

The files currently in this folder are:

`accordion.tsx`
Accordion primitive.

`alert-dialog.tsx`
Alert dialog wrapper.

`alert.tsx`
Alert block component.

`aspect-ratio.tsx`
Aspect ratio helper component.

`avatar.tsx`
Avatar primitive.

`badge.tsx`
Badge component.

`breadcrumb.tsx`
Breadcrumb primitive.

`button.tsx`
Reusable button component.

`calendar.tsx`
Calendar/date selection component.

`card.tsx`
Card primitive.

`carousel.tsx`
Carousel wrapper.

`chart.tsx`
Chart-related helpers.

`checkbox.tsx`
Checkbox wrapper.

`collapsible.tsx`
Collapsible panel helper.

`command.tsx`
Command palette style component.

`context-menu.tsx`
Context menu primitive.

`dialog.tsx`
Dialog wrapper.

`drawer.tsx`
Drawer component.

`dropdown-menu.tsx`
Dropdown menu primitive.

`form.tsx`
Form helpers and wrappers.

`hover-card.tsx`
Hover card component.

`input-otp.tsx`
OTP-style multi-field input.

`input.tsx`
Reusable text input component.

`label.tsx`
Label component.

`menubar.tsx`
Menubar primitive.

`navigation-menu.tsx`
Navigation menu component.

`pagination.tsx`
Pagination component.

`popover.tsx`
Popover wrapper.

`progress.tsx`
Progress bar component.

`radio-group.tsx`
Radio group component.

`resizable.tsx`
Resizable layout helpers.

`scroll-area.tsx`
Scroll area component.

`select.tsx`
Select component.

`separator.tsx`
Separator line primitive.

`sheet.tsx`
Sheet overlay component.

`sidebar.tsx`
Sidebar-related helper.

`skeleton.tsx`
Skeleton loading component.

`slider.tsx`
Slider component.

`sonner.tsx`
Toast or notification wrapper.

`switch.tsx`
Switch/toggle control.

`table.tsx`
Table primitive.

`tabs.tsx`
Tabs component.

`textarea.tsx`
Textarea component.

`toggle-group.tsx`
Grouped toggle buttons.

`toggle.tsx`
Toggle control.

`tooltip.tsx`
Tooltip component.

### Why The `ui` Folder Exists

This folder acts as an internal component library.
It separates generic interface primitives from feature-specific app logic.
That keeps feature files focused.

## Data Flow Summary

The app has three main data layers:

1. UI state inside React components.
2. Persistent browser storage through IndexedDB and sessionStorage.
3. Peer-to-peer runtime sync through PeerJS.

### Chat Flow

1. User sends a message in `Chat.tsx`.
2. Message is written to local component state.
3. Message is saved through `saveMessage()`.
4. Message is broadcast through `broadcast({ type: 'chat-message' })`.
5. Connected peers receive the message and also save it locally.

### Task Flow

1. User creates or edits a task in `ProgressTracker.tsx`.
2. Task state updates locally.
3. Task is persisted via IndexedDB helpers.
4. Task changes are broadcast using `task-update` or `task-delete`.
5. Connected peers update local task state when messages arrive.

### Code Flow

1. User edits code in Monaco.
2. `CodeEditorPanel.tsx` updates the code object for the current language.
3. The new code string is broadcast using `code-update`.
4. Peers apply the remote code update for the corresponding language.

### Whiteboard Flow

1. User draws on the canvas.
2. A drawing action object is created.
3. The action is appended locally.
4. The same action is broadcast to peers.
5. Peers append the action and redraw the canvas.

### AI Assistant Flow

1. User opens the AI tab or AI code explainer.
2. The component checks whether WebLLM is already loaded.
3. If not loaded, it initializes the local model.
4. The prompt is assembled from user intent plus workspace context.
5. The model returns a completion in-browser.
6. The response is rendered in the UI.

## Persistence Summary

Current persistent browser data includes:

- task entries,
- chat messages,
- room ID in session storage.

Potential persistence support also exists for:

- shared files.

This means the project already distinguishes between:

- temporary session identity,
- local long-term storage,
- live network synchronization.

## Folder Responsibility Summary

If you need a fast mental model, use this:

- `src/routes/` decides which page is shown.
- `src/router.tsx` creates the router.
- `src/components/` renders the product experience.
- `src/components/ui/` provides generic UI building blocks.
- `src/lib/` handles storage, networking, utilities, and AI helpers.
- `src/hooks/` contains reusable React behavior helpers.
- `src/styles.css` defines the visual system.

## Build And Run Notes

To run the project locally:

1. Install dependencies with npm or bun.
2. Start the dev server with `npm run dev`.
3. Open the local development URL in the browser.
4. Open multiple browser tabs or multiple machines to test peer connections.

To build the project:

1. Run `npm run build`.
2. Review the generated `dist/` output.

To preview the production build:

1. Run `npm run preview`.

## Current Strengths Of The Codebase

- Clear separation between feature UI and lower-level helpers.
- Practical local persistence for chat and tasks.
- Real peer-to-peer sync foundation.
- Real in-browser AI support instead of a fake mock assistant.
- Distinctive visual identity.
- A single-dashboard product structure that is easy to demo.

## Current Gaps Or Future Opportunities

- File sharing is not yet persisted to IndexedDB.
- Cursor movement syncing is only partially scaffolded.
- `sync-request` and `full-sync` exist in types but are not fully realized.
- More mobile-specific layout refinement could be added.
- More route-based structure could be introduced if the product grows beyond one screen.
- AI features could read more app context, including code editor state or whiteboard summaries.

## Suggested Onboarding Path For New Contributors

If someone is new to the project, the easiest reading order is:

1. `package.json`
2. `src/routes/index.tsx`
3. `src/components/CollabLANApp.tsx`
4. `src/lib/peer-sync.tsx`
5. `src/lib/indexeddb.ts`
6. `src/lib/webllm.ts`
7. The feature components in `src/components/`
8. `src/styles.css`

This order moves from top-level app entry into the collaboration architecture and then into the detailed features.

## Final Summary

CollabLAN is a browser-based LAN collaboration workspace with a strong demo-friendly interface and a practical internal architecture.
The project is organized around a clear split between feature components, shared UI primitives, local storage helpers, peer sync infrastructure, and local AI logic.
Even though the app is visually playful, the codebase is structured in a way that makes future iteration straightforward.

If you are reading this repository for maintenance, the most important things to remember are:

- routing is minimal and centered on a single main screen,
- collaboration behavior depends heavily on `peer-sync.tsx`,
- local persistence depends on `indexeddb.ts`,
- AI depends on `webllm.ts`,
- the product shell is assembled in `CollabLANApp.tsx`,
- the visual identity is defined in `styles.css`.

That combination is what makes the project work.
