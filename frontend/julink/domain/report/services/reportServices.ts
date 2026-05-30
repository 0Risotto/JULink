import { post } from "@/util/api/axios";
import { ReportRequest, ReportResponse } from "../types";

export const createReport = (request: ReportRequest) =>
  post<ReportResponse>("/reports", request);

export const reportPost = (postId: string, message: string) =>
  post<ReportResponse>(`/posts/${postId}/report`, { message });
