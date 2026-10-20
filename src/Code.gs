function doGet(){return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('ASTILLA MAPAL · Compras de Suministro').addMetaTag('viewport','width=device-width, initial-scale=1');}
function include_(name){return HtmlService.createHtmlOutputFromFile(name).getContent();}
function result_(config,filters){
  var data=SheetsReader.read(config),result=Suppliers.calculate(data,config.suppliers,filters);
  result.reports=Reporting.build(result.rows,config.plans,config.suppliers,filters);
  result.warnings=result.warnings.concat(result.reports.warnings);
  if(!config.plans.length)result.warnings.push('No hay plan cargado: cumplimiento no disponible.');
  var aliases=Suppliers.build(config.suppliers);
  result.suppliers=Array.from(new Set(result.suppliers.concat(config.plans.map(function(plan){var key=Domain.key(plan.supplier);return aliases[key]||key;})))).sort();
  result.updatedAt=new Date().toISOString();return result;
}
function getDashboard(filters){
  filters=filters||{};
  ['from','to'].forEach(function(k){if(filters[k]&&!Domain.validDate(filters[k]))throw new Error('Fecha de filtro inválida.');});
  if(filters.from&&filters.to&&filters.from>filters.to)throw new Error('El inicio debe ser anterior al término.');
  return result_(Config.read(),filters);
}
function syncProcessed(){
  var lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw new Error('Ya hay una sincronización en curso.');
  try{
    var config=Config.read();if(!config.storeId)throw new Error('Ejecute configurarProyecto.');
    var result=result_(config,{});Workspace.diagnostics(config,result);
    // Absence of plan does not invalidate actual/estimated incomes. Data warnings do.
    var blocking=result.warnings.filter(function(w){return w!=='No hay plan cargado: cumplimiento no disponible.';});
    if(blocking.length)throw new Error('Revise DIAGNOSTICO y PROVEEDORES_PENDIENTES en la base independiente antes de guardar.');
    var saved=Repository.save(config,result.rows);Workspace.saveReports(config,result.reports);return saved;
  }finally{lock.releaseLock();}
}
