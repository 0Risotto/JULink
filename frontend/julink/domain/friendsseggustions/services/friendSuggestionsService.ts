import { get } from "@/util/api/axios";
import { FriendSuggestionsResponse } from "../types";

interface BackendSuggestion {
  user_id: string;
  username: string;
  mutuals: number;
}

export const getFriendSuggestions =
  async (): Promise<FriendSuggestionsResponse> => {
    const data = await get<BackendSuggestion[]>("/follow/suggestion", {
      params: { limit: 20 },
    });
    return {
      status: "success",
      suggestions: data.map((suggestion) => ({
        username: suggestion.username,
        fullName: suggestion.username,
        profilePictureUrl: null,
      })),
    };
  };
