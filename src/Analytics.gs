/** Only adds compatible quantities: estimated coverage is never labeled SAP actuals. */
var Analytics=(function(){
  function build(result,readiness){
    var k=result.kpis,rows=result.rows,monthly=result.reports.monthly,days=Object.create(null),products=Object.create(null);
    var knownPlan=monthly.filter(function(r){return r.plan!==null;}),denominator=knownPlan.reduce(function(s,r){return s+r.plan;},0);
    var canCompare=readiness.complete&&readiness.sap&&knownPlan.length===monthly.length&&monthly.length>0&&monthly.every(function(r){return !r.partial;})&&denominator>0;
    rows.forEach(function(r){if(!days[r.date])days[r.date]={date:r.date,sap:0,estimated:0};if(!products[r.product])products[r.product]={product:r.product,sap:0,estimated:0};var type=r.status==='SAP'?'sap':'estimated';days[r.date][type]+=r.tonnes;products[r.product][type]+=r.tonnes;});
    var fallback=rows.filter(function(r){return r.status==='ESTIMADO'&&r.fallback;});
    var unplanned=monthly.filter(function(r){return r.plan===null;}).length;
    return {daily:Object.keys(days).sort().map(function(d){return days[d];}),products:Object.keys(products).sort().map(function(p){return products[p];}),
      kpis:{coverage:readiness.complete&&readiness.sap&&readiness.receipts?k.sap+k.estimated:null,plan:denominator||null,sapPercent:canCompare?k.sap/denominator*100:null,projectedPercent:canCompare&&readiness.receipts?(k.sap+k.estimated)/denominator*100:null,gap:canCompare&&readiness.receipts?Math.max(0,denominator-k.sap-k.estimated):null,suppliers:result.groups.length,fallbackTrucks:fallback.length,fallbackTonnes:fallback.reduce(function(s,r){return s+r.tonnes;},0),dailyAverage:Object.keys(days).length?(k.sap+k.estimated)/Object.keys(days).length:0,unplanned:unplanned},
      bySupplier:result.groups.slice().sort(function(a,b){return b.sap+b.estimated-a.sap-a.estimated;})};
  }
  return {build:build};
})();
