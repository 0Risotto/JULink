import { get, post, patch } from "@/util/api/axios";
import { Page } from "@/domain/posts/types";
import { CreateLostAndFoundRequest, LostAndFoundResponse } from "../types";

interface BackendLostAndFound {
  id: string;
  owner_id: string;
  owner_username: string;
  description: string;
  college: string;
  image_url: string | null;
  phone_number: string | null;
  kind: string;
  is_resolved: boolean;
  created_at: string;
}

interface BackendPage<T> {
  items: T[];
  next_cursor: string | null;
}

const cursorCache = new Map<string, string>();

const mapItem = (item: BackendLostAndFound): LostAndFoundResponse => ({
  id: item.id,
  ownerId: item.owner_id,
  ownerUsername: item.owner_username,
  ownerProfilePicture: null,
  description: item.description,
  college: item.college as LostAndFoundResponse["college"],
  imageURL: item.image_url || "",
  phoneNumber: item.phone_number || undefined,
  type: item.kind as LostAndFoundResponse["type"],
  isResolved: item.is_resolved,
  createdAt: item.created_at,
});

export const createLostAndFound = async (
  data: CreateLostAndFoundRequest,
): Promise<LostAndFoundResponse> => {
  const response = await post<BackendLostAndFound>("/lost-and-founds", {
    description: data.description,
    college: data.college,
    image_url: data.imageURL,
    phone_number: data.phoneNumber,
    type: data.type,
  });
  return mapItem(response);
};

export const markAsResolved = async (id: string): Promise<LostAndFoundResponse> => {
  const response = await patch<BackendLostAndFound>(
    `/lost-and-founds/${id}/resolve`,
  );
  return mapItem(response);
};

export const claimLostAndFound = (id: string, message?: string) =>
  post<{ status: string; message: string }>(`/lost-and-founds/${id}/claim`, {
    message,
  });

export const getLostAndFounds = async (
  college?: string,
  type?: string,
  isResolved?: boolean,
  page = 0,
  size = 10,
): Promise<Page<LostAndFoundResponse>> => {
  const key = `lostfound:${college || "all"}:${type || "all"}:${isResolved ?? "all"}`;
  const cursor = page > 0 ? cursorCache.get(`${key}:${page - 1}`) : undefined;

  const data = await get<BackendPage<BackendLostAndFound>>("/lost-and-founds", {
    params: {
      ...(college && college !== "ALL" ? { college } : {}),
      ...(type && type !== "ALL" ? { type } : {}),
      ...(isResolved !== undefined ? { is_resolved: isResolved } : {}),
      limit: size,
      ...(cursor ? { cursor } : {}),
    },
  });

  if (data.next_cursor) cursorCache.set(`${key}:${page}`, data.next_cursor);

  const content = data.items.map(mapItem);
  return {
    content,
    pageable: null,
    totalElements: content.length,
    totalPages: data.next_cursor ? page + 2 : page + 1,
    last: !data.next_cursor,
    size,
    number: page,
    sort: null,
    first: page === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
};
