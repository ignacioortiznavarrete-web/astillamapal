/** Header-only source inspection; every write targets the managed independent workbook. */
var Discovery = (function(){
  function run(options){
    options=options||{};var lock=LockService.getScriptLock();lock.waitLock(10000);
    try{
      var p=PropertiesService.getScriptProperties(),baseId=p.getProperty('PROCESSED_SPREADSHEET_ID');
      if(!baseId||p.getProperty('ASTILLA_MANAGED_BASE_ID')!==baseId||Setup.sourceIds.indexOf(baseId)>=0)throw new Error('Ejecute configurarProyecto para crear una base independiente.');
      var sourceIds=Setup.sourceIds.slice(),raw=p.getProperty('SOURCES_JSON'),declared=raw?JSON.parse(raw):[];
      var book=SpreadsheetApp.openById(baseId),target=Setup.ensure(book,'FUENTES',Setup.schemas.FUENTES);
      var existing=target.getLastRow()>1?target.getRange(2,1,target.getLastRow()-1,10).getDisplayValues():[],known=Object.create(null),found=0,messages=[];
      existing=existing.filter(function(r){return !Config.placeholder(r[2])&&!Config.placeholder(r[3]);});
      declared.concat(existing.map(function(r){return {id:r[2]};})).forEach(function(s){var id=Config.spreadsheetId(s.id);if(id===baseId)throw new Error('La base coincide con una fuente declarada.');if(id&&!Config.placeholder(id)&&sourceIds.indexOf(id)<0)sourceIds.push(id);});
      existing.forEach(function(r,i){r[2]=Config.spreadsheetId(r[2]);known[JSON.stringify([r[2],r[3]])]=i;});
      sourceIds.forEach(function(id){
        try{
          SpreadsheetApp.openById(id).getSheets().forEach(function(sheet){
            if(!sheet.getLastRow()||!sheet.getLastColumn())return;
            var key=JSON.stringify([id,sheet.getName()]),at=known[key],previous=at===undefined?null:existing[at];
            var configured=previous?{kind:Domain.key(previous[1]).toLowerCase(),headerRow:Number(previous[4]),columns:{date:previous[5],supplier:previous[6],product:previous[7],guide:previous[8],tonnes:previous[9]}}:{kind:'auto',columns:{}};
            try{
              var schema=Headers.resolve(sheet.getRange(1,1,Math.min(50,sheet.getLastRow()),Math.min(200,sheet.getLastColumn())).getDisplayValues(),configured);
              var name=function(k){return configured.columns[k]&&/^@/.test(configured.columns[k])?configured.columns[k]:schema.indices[k]===undefined?'':schema.headers[schema.indices[k]];};
              var active=options.activate?'SI':previous?previous[0]:'NO';
              var row=[active,schema.kind,id,sheet.getName(),schema.row,name('date'),name('supplier'),name('product'),name('guide'),name('tonnes')];
              if(previous)existing[at]=row;else{known[key]=existing.length;existing.push(row);found++;}
              messages.push(sheet.getName()+': '+schema.kind+', encabezados fila '+schema.row+', fecha '+name('date')+'.');
            }catch(e){if(previous)messages.push(sheet.getName()+': '+e.message);}
          });
        }catch(e){messages.push('No se pudo inspeccionar '+id+': '+e.message);}
      });
      Workspace.replace(book,'FUENTES',existing);
      messages.push('Fuentes nuevas: '+found+'. '+(options.activate?'Se activaron las pestañas compatibles detectadas.':'Se conservaron las activaciones existentes.')+' Las fuentes originales no se modificaron.');
      Workspace.replace(book,'DIAGNOSTICO',messages.map(function(m){return [new Date().toISOString(),'CONFIGURACION',m];}));
      var result={candidates:found,messages:messages,baseUrl:book.getUrl()};console.log(JSON.stringify(result));return result;
    }finally{lock.releaseLock();}
  }
  return {run:run};
})();
function detectarFuentes(){return Discovery.run();}
function prepararProyecto(){var base=configurarProyecto();var discovery=Discovery.run({activate:true});return {base:base,discovery:discovery};}
