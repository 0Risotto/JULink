export interface FriendSuggestion {
  username: string;
  fullName: string;
  profilePictureUrl: string | null;
}

export interface FriendSuggestionsResponse {
  status: "success" | "error";
  message?: string;
  suggestions?: FriendSuggestion[];
}
