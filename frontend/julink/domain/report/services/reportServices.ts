import { post } from "@/util/api/axios";
import { ReportRequest, ReportResponse } from "../types";

export const createReport = async (
  request: ReportRequest,
): Promise<ReportResponse> => {
  const response = await post<{ status: string; id: string }>("/reports", {
    target_type: request.targetType,
    target_id: request.targetId,
    message: request.message,
  });

  return {
    status: response.status,
    targetType: request.targetType,
    targetId: request.targetId,
    message: request.message,
  };
};

export const reportPost = (postId: string, message: string) =>
  createReport({
    targetType: "POST",
    targetId: postId,
    message,
  });
