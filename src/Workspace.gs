/** Reads user-maintained configuration only from the independent base. */
var Workspace = (function () {
  function rows(book,name){
    var sheet=book.getSheetByName(name);if(!sheet || sheet.getLastRow()<2)return [];
    var expected=Setup.schemas[name];
    if(sheet.getRange(1,1,1,expected.length).getDisplayValues()[0].join('|')!==expected.join('|'))throw new Error('Revise encabezados de '+name);
    return sheet.getRange(2,1,sheet.getLastRow()-1,expected.length).getValues().filter(function(r){return r.some(function(v){return v!=='';});});
  }
  function load(id){
    if(!id)return {suppliers:[],plans:[],sources:[]};
    var book=SpreadsheetApp.openById(id);
    var suppliers=rows(book,'PROVEEDORES').map(function(r){if(!r[0]||!r[1])throw new Error('Complete ambos nombres en PROVEEDORES');return {name:r[1],aliases:[r[0]]};});
    var plans=rows(book,'PLAN_MENSUAL').map(function(r){return {month:r[0] instanceof Date?Utilities.formatDate(r[0],book.getSpreadsheetTimeZone(),'yyyy-MM'):String(r[0]).trim(),supplier:r[1],product:r[2],tonnes:r[3],price:r[4]};});
    var configured=rows(book,'FUENTES');
    var disabled=configured.filter(function(r){return r[0]===false||['NO','FALSE'].indexOf(Domain.key(r[0]))>=0;}).map(function(r){return {id:String(r[2]).trim(),name:String(r[3]).trim()};});
    var sources=configured.filter(function(r){return r[0]===true || ['SI','TRUE'].indexOf(Domain.key(r[0]))>=0;}).map(function(r){
      var columns={date:r[5],supplier:r[6],product:r[7],guide:r[8]};if(Domain.key(r[1])==='SAP')columns.tonnes=r[9];
      return {kind:Domain.key(r[1]).toLowerCase(),id:String(r[2]).trim(),sheets:[String(r[3]).trim()||'*'],headerRow:Number(r[4])||undefined,columns:columns};
    });
    return {suppliers:suppliers,plans:plans,sources:sources,disabled:disabled};
  }
  function replace(book,name,values){
    var headers=Setup.schemas[name],sheet=Setup.ensure(book,name,headers);
    var safe=values.map(function(row){return row.map(function(v){return v===null?'':typeof v==='string'&&!/^@[A-Za-z]{1,3}$/.test(v)&&/^[=+@-]/.test(v)?"'"+v:v;});});
    if(safe.length)sheet.getRange(2,1,safe.length,headers.length).setValues(safe);
    var end=safe.length+1;if(sheet.getLastRow()>end)sheet.getRange(end+1,1,sheet.getLastRow()-end,headers.length).clearContent();
  }
  function diagnostics(config,result){
    var book=SpreadsheetApp.openById(config.storeId);
    replace(book,'ALERTAS_GUIAS',(result.guideAlerts||[]).map(function(a){return [result.period&&result.period.from?result.period.from.slice(0,7):'',a.supplier,a.guide,a.count,a.locations.map(function(l){return l.sourceId+' / '+l.sheet+' / fila '+(l.row||'?');}).join('; '),a.message];}));
    replace(book,'PROVEEDORES_PENDIENTES',(result.unmappedSuppliers||[]).map(function(s){return [s];}));
    replace(book,'DIAGNOSTICO',result.warnings.map(function(w){return [new Date().toISOString(),'ADVERTENCIA',w];}));
  }
  function saveReports(config,reports){
    var book=SpreadsheetApp.openById(config.storeId);
    replace(book,'RESUMEN_MENSUAL',reports.monthly.map(function(r){return [r.month,r.supplier,r.product,r.pending,r.estimated,reports.availability&&!reports.availability.sap?'':r.sap,r.plan===null?'':r.plan,r.sapPercent===null?'':r.sapPercent,r.projectedPercent===null?'':r.projectedPercent];}));
    replace(book,'INGRESOS_POR_MES',reports.pivot.map(function(r){return [r.year,r.supplier,r.product,r.type].concat(reports.availability&&r.type==='SAP'&&!reports.availability.sap?r.months.map(function(){return ''; }):r.months);}));
  }
  return {load:load,replace:replace,diagnostics:diagnostics,saveReports:saveReports};
})();
