import { useSelector } from 'react-redux';

const PACKAGE_PATH_MAP = {
  // Top-level modules
  // plan_studio: ['takeoff_engine', 'children', 'plan_studio'],
  plan_studio: ['takeoff_engine', 'children', 'takeoff_dash'],
  takeoff_engine: ['takeoff_engine'],
  bid_intelligence: ['bid_intelligence'],
  estimate_builder: ['estimate_builder'],
  contract_command: ['contract_command'],

  // plan_studio granular sub-features
  ps_drawing: ['takeoff_engine', 'children', 'takeoff_dash', 'children', 'ps_drawing'],
  ps_detection: ['takeoff_engine', 'children', 'takeoff_dash', 'children', 'ps_detection'],
  ps_extraction: ['takeoff_engine', 'children', 'takeoff_dash', 'children', 'ps_extraction'],
  ps_proceed: ['takeoff_engine', 'children', 'takeoff_dash', 'children', 'ps_proceed'],

  // ps_manual sub-features
  mt_annotation: ['takeoff_engine', 'children', 'takeoff_dash', 'children', 'ps_manual', 'children', 'mt_annotation'],
  mt_trade: ['takeoff_engine', 'children', 'takeoff_dash', 'children', 'ps_manual', 'children', 'mt_trade'],

  // bid_intelligence children
  bid_dashboard: ['bid_intelligence', 'children', 'bid_dashboard'],
  bid_score: ['bid_intelligence', 'children', 'bid_score'],
  req_extractor: ['bid_intelligence', 'children', 'req_extractor'],

  re_admin: ['bid_intelligence', 'children', 'req_extractor', 'children', 're_admin'],
  re_eval: ['bid_intelligence', 'children', 'req_extractor', 'children', 're_eval'],
  re_compliance: ['bid_intelligence', 'children', 'req_extractor', 'children', 're_compliance'],
  re_licensing: ['bid_intelligence', 'children', 'req_extractor', 'children', 're_licensing'],
  re_staffing: ['bid_intelligence', 'children', 'req_extractor', 'children', 're_staffing'],
  re_contractual: ['bid_intelligence', 'children', 'req_extractor', 'children', 're_contractual'],
  re_clauses: ['bid_intelligence', 'children', 'req_extractor', 'children', 're_clauses'],
  re_contact: ['bid_intelligence', 'children', 'req_extractor', 'children', 're_contact'],
  risk_radar: ['bid_intelligence', 'children', 'risk_radar'],
  scope_gap: ['bid_intelligence', 'children', 'scope_gap'],
  win_strategist: ['bid_intelligence', 'children', 'win_strategist'],
  bid_advisor: ['bid_intelligence', 'children', 'bid_advisor'],

  // win_strategist children
  ws_rewards: ['bid_intelligence', 'children', 'win_strategist', 'children', 'ws_rewards'],
  ws_scenario: ['bid_intelligence', 'children', 'win_strategist', 'children', 'ws_scenario'],

  // ws_scenario children
  sc_compliant: ['bid_intelligence', 'children', 'win_strategist', 'children', 'ws_scenario', 'children', 'sc_compliant'],
  sc_price: ['bid_intelligence', 'children', 'win_strategist', 'children', 'ws_scenario', 'children', 'sc_price'],
  sc_experience: ['bid_intelligence', 'children', 'win_strategist', 'children', 'ws_scenario', 'children', 'sc_experience'],
  sc_team: ['bid_intelligence', 'children', 'win_strategist', 'children', 'ws_scenario', 'children', 'sc_team'],
  sc_schedule: ['bid_intelligence', 'children', 'win_strategist', 'children', 'ws_scenario', 'children', 'sc_schedule'],
  sc_bafo: ['bid_intelligence', 'children', 'win_strategist', 'children', 'ws_scenario', 'children', 'sc_bafo'],

  // bid_dashboard children
  bd_overview: ['bid_intelligence', 'children', 'bid_dashboard', 'children', 'bd_overview'],
  bd_scope: ['bid_intelligence', 'children', 'bid_dashboard', 'children', 'bd_scope'],
  bd_timeline: ['bid_intelligence', 'children', 'bid_dashboard', 'children', 'bd_timeline'],
  bd_insights: ['bid_intelligence', 'children', 'bid_dashboard', 'children', 'bd_insights'],
  bd_procurement: ['bid_intelligence', 'children', 'bid_dashboard', 'children', 'bd_procurement'],

  // bd_procurement children
  po_clarification: ['bid_intelligence', 'children', 'bid_dashboard', 'children', 'bd_procurement', 'children', 'po_clarification'],
  po_site: ['bid_intelligence', 'children', 'bid_dashboard', 'children', 'bd_procurement', 'children', 'po_site'],
  po_contact: ['bid_intelligence', 'children', 'bid_dashboard', 'children', 'bd_procurement', 'children', 'po_contact'],

  // contract_command children
  bid_invites: ['contract_command', 'children', 'bid_invites'],
  rfi_drafter: ['contract_command', 'children', 'rfi_drafter'],
  clause_assist: ['contract_command', 'children', 'clause_assist'],
  clause_file: ['contract_command', 'children', 'clause_assist', 'children', 'clause_file'],
  clause_input: ['contract_command', 'children', 'clause_assist', 'children', 'clause_input'],
  contract_audit: ['contract_command', 'children', 'contract_audit'],
  contract_health_report_access: ['contract_command', 'children', 'contract_audit', 'children', 'audit_report'],
  // contract_audit children
audit_file:  ['contract_command', 'children', 'contract_audit', 'children', 'audit_file'],
audit_input: ['contract_command', 'children', 'contract_audit', 'children', 'audit_input'],
  priority_fixes_access: ['contract_command', 'children', 'contract_audit', 'children', 'audit_report', 'children', 'priority_fixes'],
  health_identified_clauses_access: ['contract_command', 'children', 'contract_audit', 'children', 'audit_report', 'children', 'identified_clauses'],
  identified_clauses_access: ['contract_command', 'children', 'clause_assist', 'children', 'identified_clauses_access'],
};

export function resolvePackageEnabled(packageList, packageModule, options = {}) {
  const { strict = false } = options;

  if (!packageModule) return true;
  if (!packageList) return strict ? false : true;

  const path = PACKAGE_PATH_MAP[packageModule];
  if (path) {
    let node = packageList;
    for (const key of path) {
      if (node == null || typeof node !== 'object' || !(key in node)) {
        return strict ? false : true;
      }
      node = node[key];
    }
    if (node == null) return strict ? false : true;
    return node.enabled !== false && node.enabled !== 0;
  }

  const topLevel = packageList?.[packageModule];
  if (topLevel == null) return strict ? false : true;
  return topLevel.enabled !== false && topLevel.enabled !== 0;
}

const resolvePermissions = (permissionsList, module) => {
  if (!permissionsList || !module) return {};

  if (permissionsList[module] && typeof permissionsList[module] === 'object') {
    return permissionsList[module];
  }

  const visited = new Set();
  const stack = [permissionsList];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);

    if (current[module] && typeof current[module] === 'object') {
      return current[module];
    }

    const children = current.children;
    if (Array.isArray(children)) {
      stack.push(...children);
    } else if (children && typeof children === 'object') {
      if (children[module] && typeof children[module] === 'object') {
        return children[module];
      }
      stack.push(...Object.values(children));
    }

    for (const value of Object.values(current)) {
      if (value && typeof value === 'object' && value !== children) {
        stack.push(value);
      }
    }
  }

  return {};
};

const usePermissions = (module = '', packageModule = '') => {
  const permissionsList = useSelector((s) => s?.auth?.user?.[0]?.permission_info);
  const packageList = useSelector((s) => s?.auth?.user?.[0]?.package_info);

  const permissions = resolvePermissions(permissionsList, module);
  const packagePermissions = resolvePackageEnabled(packageList, packageModule);

  return { permissions, packagePermissions };
};

export default usePermissions;
