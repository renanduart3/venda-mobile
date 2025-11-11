let useReportsMock = false;
let agentMode = false;

export function getUseReportsMock(): boolean {
  try {
    if (typeof process !== 'undefined' && (process as any).env && (process as any).env.EXPO_PUBLIC_USE_REPORTS_MOCK === '1') {
      return true;
    }
  } catch {}
  return useReportsMock;
}

export function setUseReportsMock(v: boolean) {
  useReportsMock = !!v;
}

export function getAgentMode(): boolean {
  try {
    if (typeof process !== 'undefined' && (process as any).env && (process as any).env.EXPO_PUBLIC_AGENT_MODE === '1') {
      return true;
    }
  } catch {}
  return agentMode;
}

export function setAgentMode(v: boolean) {
  agentMode = !!v;
}

