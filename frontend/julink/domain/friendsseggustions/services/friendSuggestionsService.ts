import { get } from "@/util/api/axios";
import { FriendSuggestionsResponse } from "../types";

export const getFriendSuggestions = () =>
  get<FriendSuggestionsResponse>("/follow/suggestion");
