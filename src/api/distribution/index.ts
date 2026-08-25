import type { BaseQueryParams, PageResult } from "@/api/common";
import request from "@/utils/request";
import type {
  AgentAuditForm,
  AgentForm,
  AgentItem,
  AgentLogItem,
  AgentQuery,
  AgentTypeForm,
  AgentTypeItem,
  CommissionItem,
  CommissionQuery,
  DistributionConfigQuery,
  DistributionAgentAnalyticsDetail,
  DistributionAgentAnalyticsQuery,
  DistributionAgentPerformance,
  DistributionAnalyticsOverview,
  DistributionAnalyticsQuery,
  DistributionLevelForm,
  DistributionLevelItem,
  DistributionTaskAssigneeItem,
  DistributionTaskAssigneeQuery,
  DistributionTaskForm,
  DistributionTaskItem,
  DistributionTaskQuery,
  SettlementConfig,
  SettlementItem,
  SettlementQuery,
  SettlementRunResult,
  TeamNode,
  WithdrawalItem,
  WithdrawalQuery,
} from "./types";

const BASE_URL = "/api/v1/distribution";

export const DistributionAPI = {
  getTypePage: (params: DistributionConfigQuery) =>
    request<unknown, PageResult<AgentTypeItem>>({
      url: `${BASE_URL}/agent-types/page`,
      method: "get",
      params,
    }),
  getTypeForm: (id: string) =>
    request<unknown, AgentTypeItem>({ url: `${BASE_URL}/agent-types/${id}/form`, method: "get" }),
  createType: (data: AgentTypeForm) =>
    request({ url: `${BASE_URL}/agent-types`, method: "post", data }),
  updateType: (id: string, data: AgentTypeForm) =>
    request({ url: `${BASE_URL}/agent-types/${id}`, method: "put", data }),
  updateTypeStatus: (id: string, status: number) =>
    request({ url: `${BASE_URL}/agent-types/${id}/status`, method: "patch", data: { status } }),
  deleteType: (id: string) => request({ url: `${BASE_URL}/agent-types/${id}`, method: "delete" }),

  getLevelPage: (params: DistributionConfigQuery) =>
    request<unknown, PageResult<DistributionLevelItem>>({
      url: `${BASE_URL}/levels/page`,
      method: "get",
      params,
    }),
  getLevelForm: (id: string) =>
    request<unknown, DistributionLevelItem>({
      url: `${BASE_URL}/levels/${id}/form`,
      method: "get",
    }),
  createLevel: (data: DistributionLevelForm) =>
    request({ url: `${BASE_URL}/levels`, method: "post", data }),
  updateLevel: (id: string, data: DistributionLevelForm) =>
    request({ url: `${BASE_URL}/levels/${id}`, method: "put", data }),
  updateLevelStatus: (id: string, status: number) =>
    request({ url: `${BASE_URL}/levels/${id}/status`, method: "patch", data: { status } }),
  deleteLevel: (id: string) => request({ url: `${BASE_URL}/levels/${id}`, method: "delete" }),

  getAgentPage: (params: AgentQuery) =>
    request<unknown, PageResult<AgentItem>>({
      url: `${BASE_URL}/agents/page`,
      method: "get",
      params,
    }),
  getAgentDetail: (id: string) =>
    request<unknown, AgentItem>({ url: `${BASE_URL}/agents/${id}`, method: "get" }),
  createAgent: (data: AgentForm) => request({ url: `${BASE_URL}/agents`, method: "post", data }),
  updateAgent: (id: string, data: AgentForm) =>
    request({ url: `${BASE_URL}/agents/${id}`, method: "put", data }),
  auditAgent: (id: string, data: AgentAuditForm) =>
    request({ url: `${BASE_URL}/agents/${id}/audit`, method: "put", data }),
  updateAgentStatus: (id: string, status: number, reason: string) =>
    request({ url: `${BASE_URL}/agents/${id}/status`, method: "put", data: { status, reason } }),
  adjustAgentLevel: (id: string, levelId: string, reason: string) =>
    request({ url: `${BASE_URL}/agents/${id}/level`, method: "put", data: { levelId, reason } }),
  adjustAgentRates: (
    id: string,
    customLevel1RateBps: number | null,
    customLevel2RateBps: number | null,
    reason: string
  ) =>
    request({
      url: `${BASE_URL}/agents/${id}/rates`,
      method: "put",
      data: { customLevel1RateBps, customLevel2RateBps, reason },
    }),
  getAgentLogs: (id: string, params: Partial<BaseQueryParams>) =>
    request<unknown, PageResult<AgentLogItem>>({
      url: `${BASE_URL}/agents/${id}/logs`,
      method: "get",
      params,
    }),

  getTeamTree: (rootAgentId?: string) =>
    request<unknown, TeamNode | TeamNode[]>({
      url: `${BASE_URL}/team/tree`,
      method: "get",
      params: { rootAgentId },
    }),
  getCommissionPage: (params: CommissionQuery) =>
    request<unknown, PageResult<CommissionItem>>({
      url: `${BASE_URL}/commissions/page`,
      method: "get",
      params,
    }),

  getSettlementConfig: () =>
    request<unknown, SettlementConfig>({ url: `${BASE_URL}/settlement/config`, method: "get" }),
  updateSettlementConfig: (data: SettlementConfig) =>
    request<unknown, SettlementConfig>({
      url: `${BASE_URL}/settlement/config`,
      method: "put",
      data,
    }),
  runDueSettlement: () =>
    request<unknown, SettlementRunResult>({
      url: `${BASE_URL}/settlements/run-due`,
      method: "post",
    }),
  getSettlementPage: (params: SettlementQuery) =>
    request<unknown, PageResult<SettlementItem>>({
      url: `${BASE_URL}/settlements/page`,
      method: "get",
      params,
    }),
  getWithdrawalPage: (params: WithdrawalQuery) =>
    request<unknown, PageResult<WithdrawalItem>>({
      url: `${BASE_URL}/withdrawals/page`,
      method: "get",
      params,
    }),
  auditWithdrawal: (id: string, status: 1 | 2, reason: string) =>
    request({
      url: `${BASE_URL}/withdrawals/${id}/audit`,
      method: "put",
      data: { status, reason },
    }),
  markWithdrawalPaid: (id: string, transferNo: string, remark?: string) =>
    request({
      url: `${BASE_URL}/withdrawals/${id}/paid`,
      method: "put",
      data: { transferNo, remark },
    }),

  getTaskPage: (params: DistributionTaskQuery) =>
    request<unknown, PageResult<DistributionTaskItem>>({
      url: `${BASE_URL}/tasks/page`,
      method: "get",
      params,
    }),
  getTaskDetail: (id: string) =>
    request<unknown, DistributionTaskItem>({ url: `${BASE_URL}/tasks/${id}`, method: "get" }),
  createTask: (data: DistributionTaskForm) =>
    request({ url: `${BASE_URL}/tasks`, method: "post", data }),
  updateTask: (id: string, data: DistributionTaskForm) =>
    request({ url: `${BASE_URL}/tasks/${id}`, method: "put", data }),
  deleteTask: (id: string) => request({ url: `${BASE_URL}/tasks/${id}`, method: "delete" }),
  publishTask: (id: string) => request({ url: `${BASE_URL}/tasks/${id}/publish`, method: "post" }),
  cancelTask: (id: string) => request({ url: `${BASE_URL}/tasks/${id}/cancel`, method: "post" }),
  getTaskAssigneePage: (id: string, params: DistributionTaskAssigneeQuery) =>
    request<unknown, PageResult<DistributionTaskAssigneeItem>>({
      url: `${BASE_URL}/tasks/${id}/assignees/page`,
      method: "get",
      params,
    }),

  getAnalyticsOverview: (params: DistributionAnalyticsQuery) =>
    request<unknown, DistributionAnalyticsOverview>({
      url: `${BASE_URL}/analytics/overview`,
      method: "get",
      params,
    }),
  getAgentAnalyticsPage: (params: DistributionAgentAnalyticsQuery) =>
    request<unknown, PageResult<DistributionAgentPerformance>>({
      url: `${BASE_URL}/analytics/agents/page`,
      method: "get",
      params,
    }),
  getAgentAnalytics: (agentId: string, params: DistributionAnalyticsQuery) =>
    request<unknown, DistributionAgentAnalyticsDetail>({
      url: `${BASE_URL}/analytics/agents/${agentId}`,
      method: "get",
      params,
    }),
  exportAnalytics: (params: DistributionAnalyticsQuery) =>
    request({
      url: `${BASE_URL}/analytics/export`,
      method: "get",
      params,
      responseType: "blob",
    }),
};

export * from "./types";
