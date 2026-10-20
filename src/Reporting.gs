/** Monthly tonnes grouped by the canonical supplier and product. No price-to-volume conversion. */
var Reporting = (function(){
  function build(rows,plans,definitions,filters){
    filters=filters||{};var aliases=Suppliers.build(definitions),groups=Object.create(null),warnings=[];
    function group(month,supplier,product){var id=JSON.stringify([month,supplier,product]);if(!groups[id])groups[id]={month:month,supplier:supplier,product:product,pending:0,estimated:0,sap:0,plan:null};return groups[id];}
    function selected(month,supplier,product){return (!filters.from||month>=filters.from.slice(0,7))&&(!filters.to||month<=filters.to.slice(0,7))&&(!filters.supplier||supplier===Domain.key(filters.supplier))&&(!filters.product||product===Domain.key(filters.product));}
    rows.forEach(function(r){var g=group(r.date.slice(0,7),r.supplier,r.product);if(r.status==='SAP')g.sap+=r.tonnes;else{g.estimated+=r.tonnes;g.pending++;}});
    var seen=Object.create(null);
    plans.forEach(function(p){
      var month=String(p.month),original=Domain.key(p.supplier),supplier=aliases[original]||original,product=Domain.key(p.product),amount=Domain.tonnes(p.tonnes);
      if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!supplier||['ASTILLA VERDE','ASTILLA VERDE C/CORT'].indexOf(product)<0||!Number.isFinite(amount)||amount<0)throw new Error('PLAN_MENSUAL: mes, proveedor, producto o PLAN_TS inválido.');
      var id=JSON.stringify([month,supplier,product]);if(seen[id])throw new Error('Plan duplicado para '+month+' / '+supplier+' / '+product);seen[id]=true;
      if(!aliases[original])warnings.push('Plan con proveedor sin homologar: '+original);
      if(selected(month,supplier,product))group(month,supplier,product).plan=amount;
    });
    var monthly=Object.keys(groups).map(function(k){var g=groups[k],last=new Date(Date.UTC(Number(g.month.slice(0,4)),Number(g.month.slice(5,7)),0)).toISOString().slice(0,10);
      g.partial=!!((filters.from&&filters.from>g.month+'-01')||(filters.to&&filters.to<last));
      g.sapPercent=!g.partial&&g.plan>0?g.sap/g.plan*100:null;g.projectedPercent=!g.partial&&g.plan>0?(g.sap+g.estimated)/g.plan*100:null;return g;
    }).sort(function(a,b){return (a.month+a.supplier+a.product).localeCompare(b.month+b.supplier+b.product);});
    var pivot=Object.create(null);
    monthly.forEach(function(g){['SAP','ESTIMADO','PLAN'].forEach(function(type){var id=JSON.stringify([g.month.slice(0,4),g.supplier,g.product,type]);if(!pivot[id])pivot[id]={year:g.month.slice(0,4),supplier:g.supplier,product:g.product,type:type,months:Array(12).fill(null)};pivot[id].months[Number(g.month.slice(5,7))-1]=type==='SAP'?g.sap:type==='ESTIMADO'?g.estimated:g.plan;});});
    return {monthly:monthly,pivot:Object.keys(pivot).map(function(k){return pivot[k];}),warnings:warnings};
  }
  return {build:build};
})();
