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
  pending: number;
  available: number;
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
  availableTime?: string | null;
  reversedTime?: string | null;
}
