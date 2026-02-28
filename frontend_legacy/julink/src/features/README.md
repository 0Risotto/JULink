# features/

Feature-based architecture — each feature is modular and self-contained.

## Example Features
- `auth/`: Authentication (login, register, reset password)
- `feed/`: Main post feed and interactions
- `profile/`: User profile pages and settings
- `messaging/`: Chats, notifications, and real-time messaging
- `search/`: Search and discovery

## Folder Convention per Feature
Each feature may include:
- 'components'/ → UI elements unique to that feature
- 'pages/' → Route-level pages for that feature
- 'hooks/' → Custom hooks used internally
- 'services/' → API calls related to that feature
- 'index.ts' → Public exports for the feature
