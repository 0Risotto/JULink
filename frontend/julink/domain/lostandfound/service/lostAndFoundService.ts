import { get, post, patch } from "@/util/api/axios";
import { Page } from "@/domain/posts/types";
import { CreateLostAndFoundRequest, LostAndFoundResponse } from "../types";

export const createLostAndFound = (data: CreateLostAndFoundRequest) =>
  post<LostAndFoundResponse>('/lost-and-founds', data);

export const markAsFound = (id: string) =>
  patch<LostAndFoundResponse>(`/lost-and-founds/${id}/found`);

export const getLostAndFounds = (
  college?: string, 
  isResolved?: boolean, 
  page = 0, 
  size = 10
) => {
  const params = new URLSearchParams();
  if (college && college !== "ALL") params.append("college", college);
  if (isResolved !== undefined) params.append("isResolved", String(isResolved));
  params.append("page", String(page));
  params.append("size", String(size));

  return get<Page<LostAndFoundResponse>>(`/lost-and-founds?${params.toString()}`);
};
