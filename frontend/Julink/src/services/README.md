# services/

Contains API and network logic for communicating with backend services.

## Files
- `apiClient.ts`: Axios or Fetch wrapper with base config (headers, interceptors)
- `authService.ts`: Auth-related endpoints
- `postService.ts`: Post CRUD operations
- `userService.ts`: User profiles and follow system
- `messageService.ts`: Messaging and notifications

> Keep these functions pure — no React hooks or components here.

