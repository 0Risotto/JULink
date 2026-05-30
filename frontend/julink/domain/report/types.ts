export type ReportTargetType = "USER" | "POST" | "MESSAGE";

export interface ReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  message: string;
}

export interface ReportResponse {
  status: string;
  timestamp?: string;
  reporterId?: number;
  reporterUsername?: string;
  targetType?: ReportTargetType;
  targetId?: string;
  targetOwnerUsername?: string;
  message?: string;
}
