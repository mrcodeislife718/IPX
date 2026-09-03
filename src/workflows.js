export const WORKFLOW_FAMILIES = Object.freeze({
  'ipx-patent-utility':['intake','identity-and-ownership','evidence','classification','prior-art-search','claims-and-scope','review','finalize','lifecycle'],
  'ipx-patent-design':['intake','identity-and-ownership','evidence','design-classification','search','review','finalize','lifecycle'],
  'ipx-trademark':['intake','identity-and-ownership','goods-services','clearance-search','evidence','review','finalize','monitoring','renewal'],
  'ipx-copyright':['intake','authorship-and-ownership','deposit-evidence','review','finalize','monitoring','lifecycle'],
  'ipx-prior-art-search':['scope','classification','query-plan','search','deduplicate','rank','human-review','evidence-package'],
  'ipx-freedom-to-operate':['scope','jurisdictions','claims-map','search','family-normalization','status-review','risk-analysis','human-review','evidence-package'],
  'ipx-defensive-publication':['intake','ownership','evidence','review','timestamp','publish','preserve'],
  'ipx-assignment-transfer':['identity','authority','ownership-chain','instrument','evidence','review','execute','preserve'],
  'ipx-maintenance-renewal':['portfolio-load','rule-resolution','deadline-calculate','notify','authorize','complete','preserve'],
  'ipx-international':['intake','priority','jurisdictions','deadline-plan','evidence','review','coordinate','lifecycle'],
  'ipx-watchdog':['enroll','fingerprint','source-plan','scan','deduplicate','score','preserve','alert','triage','escalate'],
  'ipx-diligence':['scope','ownership-chain','evidence','status','encumbrances','commercial-rights','risk','package'],
  'ipx-exchange':['asset-readiness','ownership','rights-scope','counterparty','terms','diligence','execute','record','settle']
});

export function workflowFor(serviceCode) {
  const steps = WORKFLOW_FAMILIES[serviceCode];
  if (!steps) throw new Error(`No IPX workflow registered for ${serviceCode}`);
  return steps.map((task_code,index)=>({ task_code, order:index+1, required:true }));
}

export function nextReadyTasks(tasks) {
  const completed = new Set(tasks.filter(x=>['completed','waived'].includes(x.status)).map(x=>x.task_code));
  return tasks.filter(x=>x.status==='pending' && (x.dependencies || []).every(dep=>completed.has(dep)));
}

export function deadlineState(dueAt, now=new Date()) {
  const due = new Date(dueAt); if (!Number.isFinite(due.getTime())) throw new Error('Invalid deadline');
  const ms = due.getTime()-now.getTime();
  return { due_at:due.toISOString(), overdue:ms<0, days_remaining:Math.ceil(ms/86400000), urgency:ms<0?'overdue':ms<=86400000?'critical':ms<=7*86400000?'high':ms<=30*86400000?'medium':'normal' };
}
