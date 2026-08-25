export interface DashboardTraffic {
  todayUv: number;
  todayPv: number;
  uvGrowthRate: number | null;
  pvGrowthRate: number | null;
  dates: string[];
  uvList: number[];
  pvList: number[];
}

export interface DashboardMembers {
  total: number;
  todayNew: number;
  yesterdayNew: number;
  growthRate: number | null;
}

export interface DashboardTodoCategory {
  type: string;
  label: string;
  count: number;
}

export interface DashboardTodoItem {
  id: string;
  type: string;
  title: string;
  status: string;
  occurredAt: string;
  targetRoute: string;
}

export interface DashboardActivity {
  id: string;
  type: string;
  content: string;
  occurredAt: string;
  targetRoute?: string;
}

export interface DashboardOverview {
  traffic: DashboardTraffic;
  members: DashboardMembers;
  todos: {
    total: number;
    todayNew: number;
    todayDone: number;
    categories: DashboardTodoCategory[];
    items: DashboardTodoItem[];
  };
  activities: DashboardActivity[];
}
