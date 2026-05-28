import { get, post, patch } from "@/util/api/axios";
import { Page } from "@/domain/posts/types";
import { CreateLostAndFoundRequest, LostAndFoundResponse } from "../types";

export const createLostAndFound = (data: CreateLostAndFoundRequest) =>
  post<LostAndFoundResponse>('/lost-and-founds', data);

export const markAsResolved = (id: string) =>
  patch<LostAndFoundResponse>(`/lost-and-founds/${id}/resolve`);

export const claimLostAndFound = (id: string, message?: string) =>
  post<{ status: string; notificationId?: string; message: string }>(`/lost-and-founds/${id}/claim`, { message });

export const getLostAndFounds = (
  college?: string, 
  type?: string,
  isResolved?: boolean, 
  page = 0, 
  size = 10
) => {
  const params = new URLSearchParams();
  if (college && college !== "ALL") params.append("college", college);
  if (type && type !== "ALL") params.append("type", type);
  if (isResolved !== undefined) params.append("isResolved", String(isResolved));
  params.append("page", String(page));
  params.append("size", String(size));

  return get<Page<LostAndFoundResponse>>(`/lost-and-founds?${params.toString()}`);
};
