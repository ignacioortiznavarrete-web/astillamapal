function doGet(){return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('ASTILLA MAPAL · Control de suministro').addMetaTag('viewport','width=device-width, initial-scale=1');}
function include_(name){return HtmlService.createHtmlOutputFromFile(name).getContent();}
function result_(config,filters){
  var data=SheetsReader.read(config),result=Suppliers.calculate(data,config.suppliers,filters);
  result.readiness={complete:data.complete&&(data.availability.sap||data.availability.receipts),sap:data.availability.sap,receipts:data.availability.receipts,sheets:data.sheets};
  var dataWarnings=result.warnings.filter(function(w){return !/^(SAP|Recepción): duplicado omitido /.test(w);});
  if(dataWarnings.length)result.readiness.complete=false;
  result.reports=Reporting.build(result.rows,config.plans,config.suppliers,filters);
  if(result.reports.warnings.length)result.readiness.complete=false;
  result.reports.monthly.forEach(function(r){if(!result.readiness.sap||!result.readiness.complete)r.sapPercent=null;if(!result.readiness.sap||!result.readiness.receipts||!result.readiness.complete)r.projectedPercent=null;});
  result.reports.availability=result.readiness;
  result.blockingWarnings=dataWarnings.concat(result.reports.warnings).concat(data.diagnostics.filter(function(d){return d.level==='error';}).map(function(d){return d.message;}));
  result.warnings=result.warnings.concat(result.reports.warnings).concat(data.diagnostics.map(function(d){return d.message;})).concat(config.configWarnings||[]);
  if(!config.plans.length)result.warnings.push('No hay plan cargado: cumplimiento no disponible.');
  var aliases=Suppliers.build(config.suppliers);
  result.suppliers=Array.from(new Set(result.suppliers.concat(config.plans.map(function(plan){var key=Domain.key(plan.supplier);return aliases[key]||key;})))).sort();
  result.analytics=Analytics.build(result,result.readiness);
  result.updatedAt=new Date().toISOString();
  var p=PropertiesService.getScriptProperties();result.sync={lastSuccess:p.getProperty('LAST_SYNC_SUCCESS')||null,lastError:p.getProperty('LAST_SYNC_ERROR')||null,enabled:p.getProperty('AUTO_SYNC_ENABLED')==='true'};
  return result;
}
function getDashboard(filters){
  filters=filters||{};
  ['from','to'].forEach(function(k){if(filters[k]&&!Domain.validDate(filters[k]))throw new Error('Fecha de filtro inválida.');});
  if(filters.from&&filters.to&&filters.from>filters.to)throw new Error('El inicio debe ser anterior al término.');
  return result_(Config.read(),filters);
}
function syncProcessed(){
  var lock=LockService.getScriptLock();if(!lock.tryLock(1000))throw new Error('Ya hay una sincronización en curso.');
  var p=PropertiesService.getScriptProperties();
  try{
    var config=Config.read();if(!config.storeId)throw new Error('Ejecute prepararProyecto.');
    var result=result_(config,{});Workspace.diagnostics(config,result);
    if(!result.readiness.receipts&&!result.readiness.sap)throw new Error('No se leyó ninguna fuente válida. Se conservaron los datos procesados anteriores.');
    if(result.blockingWarnings.length)throw new Error('Sincronización detenida para conservar datos anteriores: '+result.blockingWarnings.slice(0,3).join(' · ')+'. Revise DIAGNOSTICO en la base.');
    var saved=Repository.save(config,result.rows);Workspace.saveReports(config,result.reports);
    p.setProperties({LAST_SYNC_SUCCESS:saved.updatedAt,LAST_SYNC_ERROR:''});return saved;
  }catch(e){p.setProperties({LAST_SYNC_ERROR:new Date().toISOString()+' · '+e.message});
    if(config&&config.storeId)try{Workspace.replace(SpreadsheetApp.openById(config.storeId),'DIAGNOSTICO',[[new Date().toISOString(),'ERROR',e.message]]);}catch(logError){console.error('No se pudo guardar diagnóstico: '+logError.message);}
    throw e;}
  finally{lock.releaseLock();}
}
