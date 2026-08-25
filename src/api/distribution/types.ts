import type { BaseQueryParams } from "@/api/common";

export interface DistributionConfigQuery extends BaseQueryParams {
  keywords?: string;
  status?: number;
}

export interface AgentTypeForm {
  name: string;
  status: number;
  sort: number;
}

export interface AgentTypeItem extends AgentTypeForm {
  id: string;
  createTime?: string;
}

export interface DistributionLevelForm extends AgentTypeForm {
  rank: number;
  upgradeSalesAmount: number;
  distributionDepth: number;
  level1RateBps: number;
  level2RateBps: number;
}

export interface DistributionLevelItem extends DistributionLevelForm {
  id: string;
  createTime?: string;
}

export interface AgentQuery extends BaseQueryParams {
  keywords?: string;
  status?: number;
  typeId?: string;
  levelId?: string;
}

export interface AgentForm {
  memberId: string;
  realName: string;
  mobile?: string;
  wechat?: string;
  contactRemark?: string;
  typeId: string;
  levelId: string;
  parentAgentId?: string;
}

export interface AgentItem {
  id: string;
  memberId: string;
  memberNickname?: string | null;
  realName: string;
  mobile?: string | null;
  wechat?: string | null;
  contactRemark?: string | null;
  typeId?: string | null;
  typeName?: string | null;
  levelId?: string | null;
  levelName?: string | null;
  parentAgentId?: string | null;
  parentName?: string | null;
  inviteCode: string;
  customLevel1RateBps?: number | null;
  customLevel2RateBps?: number | null;
  directVerifiedSales: number;
  status: number;
  applyTime?: string | null;
  auditTime?: string | null;
  commissionSummary?: CommissionSummary;
}

export interface CommissionSummary {
  waitingVerify: number;
  pendingSettlement: number;
  settled: number;
  reversed: number;
}

export interface AgentAuditForm {
  status: number;
  typeId?: string;
  levelId?: string;
  parentAgentId?: string;
  reason: string;
}

export interface AgentLogItem {
  id: string;
  action: string;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
  reason: string;
  operatorId?: string | null;
  createTime?: string;
}

export interface TeamNode {
  id: string;
  realName: string;
  memberNickname?: string | null;
  levelId?: string | null;
  status: number;
  directVerifiedSales: number;
  children: TeamNode[];
}

export interface CommissionQuery extends BaseQueryParams {
  keywords?: string;
  agentId?: string;
  depth?: number;
  status?: number;
  startTime?: string;
  endTime?: string;
}

export interface CommissionItem {
  id: string;
  orderId: string;
  orderNo: string;
  buyerMemberId: string;
  buyerNickname?: string | null;
  beneficiaryAgentId: string;
  beneficiaryName?: string | null;
  depth: number;
  baseAmount: number;
  rateBps: number;
  commissionAmount: number;
  agentLevelName?: string | null;
  status: number;
  paidTime: string;
  pendingSettlementTime?: string | null;
  settledTime?: string | null;
  reversedTime?: string | null;
}

export type SettlementCycle = "WEEK" | "MONTH" | "QUARTER" | "YEAR";
export type WithdrawalMode = "APPLY" | "AUTO";

export interface SettlementConfig {
  id?: string;
  cycleType: SettlementCycle;
  settlementDay: number;
  withdrawalMode: WithdrawalMode;
  singleLimitAmount: number;
  nextSettlementDate?: string;
}

export interface SettlementQuery extends BaseQueryParams {
  agentId?: string;
  profitPoint?: "PRODUCT_SALES";
  startTime?: string;
  endTime?: string;
}

export interface SettlementItem {
  id: string;
  settlementNo: string;
  agentId: string;
  agentName?: string | null;
  profitPoint: "PRODUCT_SALES";
  periodStart: string;
  periodEnd: string;
  commissionCount: number;
  amount: number;
  settledTime: string;
}

export interface WithdrawalQuery extends BaseQueryParams {
  keywords?: string;
  agentId?: string;
  sourceMode?: WithdrawalMode;
  status?: number;
  startTime?: string;
  endTime?: string;
}

export interface WithdrawalItem {
  id: string;
  withdrawalNo: string;
  agentId: string;
  agentName?: string | null;
  memberId: string;
  memberNickname?: string | null;
  sourceMode: WithdrawalMode;
  amount: number;
  status: number;
  reviewBy?: string | null;
  reviewTime?: string | null;
  reviewReason?: string | null;
  transferNo?: string | null;
  paidBy?: string | null;
  paidTime?: string | null;
  paidRemark?: string | null;
  autoPeriodEnd?: string | null;
  createTime: string;
}

export interface SettlementRunResult {
  periodStart?: string;
  periodEnd?: string;
  settlementsCreated: number;
  commissionsSettled: number;
  amountSettled: number;
  withdrawalsCreated?: number;
}

export type DistributionTaskMetric = "SALES_AMOUNT" | "ORDER_COUNT";
export type DistributionTaskScope = "ALL" | "LEVEL" | "AGENT";
export type DistributionTaskDisplayStatus =
  "DRAFT" | "NOT_STARTED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";

export interface DistributionTaskForm {
  name: string;
  description?: string;
  metricType: DistributionTaskMetric;
  targetValue: number;
  startTime: string;
  endTime: string;
  assignmentScope: DistributionTaskScope;
  targetLevelId?: string;
  targetAgentIds?: string[];
}

export interface DistributionTaskItem extends DistributionTaskForm {
  id: string;
  status: number;
  displayStatus: DistributionTaskDisplayStatus;
  publishedTime?: string | null;
  cancelledTime?: string | null;
  totalAssignees: number;
  completedCount: number;
  incompleteCount: number;
  createTime?: string;
}

export interface DistributionTaskQuery extends BaseQueryParams {
  keywords?: string;
  status?: number;
  displayStatus?: DistributionTaskDisplayStatus;
  metricType?: DistributionTaskMetric;
  startTime?: string;
  endTime?: string;
}

export interface DistributionTaskAssigneeQuery extends BaseQueryParams {
  keywords?: string;
  completed?: number;
}

export interface DistributionTaskAssigneeItem {
  assignmentId: string;
  agentId: string;
  agentName?: string | null;
  mobile?: string | null;
  levelId?: string | null;
  agentStatus?: number | null;
  salesAmount: number;
  orderCount: number;
  currentValue: number;
  completed: boolean;
  progressRateBps: number;
}
