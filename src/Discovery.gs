/** Inspects headers only in originals; saves findings exclusively in our independent base. */
var Discovery = (function(){
  function run(){
    var lock=LockService.getScriptLock();lock.waitLock(10000);
    try{
      var p=PropertiesService.getScriptProperties(),baseId=p.getProperty('PROCESSED_SPREADSHEET_ID');
      if(!baseId||p.getProperty('ASTILLA_MANAGED_BASE_ID')!==baseId||Setup.sourceIds.indexOf(baseId)>=0)throw new Error('Ejecute configurarProyecto para crear una base independiente.');
      var sourceIds=Setup.sourceIds.slice(),raw=p.getProperty('SOURCES_JSON');
      if(raw)JSON.parse(raw).forEach(function(s){if(s.id===baseId)throw new Error('La base coincide con fuente declarada.');if(sourceIds.indexOf(s.id)<0)sourceIds.push(s.id);});
      var book=SpreadsheetApp.openById(baseId),target=Setup.ensure(book,'FUENTES',Setup.schemas.FUENTES),existing=target.getLastRow()>1?target.getRange(2,1,target.getLastRow()-1,10).getDisplayValues():[],known=Object.create(null),found=[],messages=[];
      existing.forEach(function(r){known[JSON.stringify([r[2],r[3]])]=true;});
      sourceIds.forEach(function(id){
        try{
          var source=SpreadsheetApp.openById(id);source.getSheets().forEach(function(sheet){
            var rowCount=Math.min(30,sheet.getLastRow()),colCount=Math.min(100,sheet.getLastColumn());
            if(!rowCount||!colCount)return;
            var data=sheet.getRange(1,1,rowCount,colCount).getDisplayValues();
            for(var i=0;i<data.length;i++){
              var normalized=data[i].map(Domain.key),required=['FECHA','PROVEEDOR','PRODUCTO','N° DE GUIA'];
              if(!required.every(function(h){return normalized.indexOf(h)>=0 && normalized.lastIndexOf(h)===normalized.indexOf(h);}))continue;
              var kind=normalized.indexOf('CANTIDAD')>=0?'sap':'receipts';
              if(kind==='sap'&&normalized.lastIndexOf('CANTIDAD')!==normalized.indexOf('CANTIDAD')){messages.push('Cantidad ambigua en '+sheet.getName());break;}
              var key=JSON.stringify([id,sheet.getName()]);
              if(!known[key]){
                var exact=function(h){return data[i][normalized.indexOf(h)];};
                // Candidates stay disabled until their semantic role is checked. Headers alone cannot establish SAP provenance.
                found.push(['NO',kind,id,sheet.getName(),i+1,exact('FECHA'),exact('PROVEEDOR'),exact('PRODUCTO'),exact('N° DE GUIA'),kind==='sap'?exact('CANTIDAD'):'']);known[key]=true;
              }
              break;
            }
          });
        }catch(e){messages.push('No se pudo inspeccionar '+id+': '+e.message);}
      });
      if(found.length)target.getRange(target.getLastRow()+1,1,found.length,10).setValues(found.map(function(row){return row.map(function(v){return typeof v==='string'&&/^[=+@-]/.test(v)?"'"+v:v;});}));
      messages.push('Candidatas encontradas: '+found.length+'. Se revisaron hasta 30 filas y 100 columnas por pestaña. Confirme TIPO y active con SI las filas correctas en FUENTES. No se alteraron fuentes.');
      // Append diagnostics, preserving prior findings.
      var diagnostics=Setup.ensure(book,'DIAGNOSTICO',Setup.schemas.DIAGNOSTICO);
      diagnostics.getRange(diagnostics.getLastRow()+1,1,messages.length,3).setValues(messages.map(function(m){return [new Date().toISOString(),'CONFIGURACION',m];}));
      var result={candidates:found.length,messages:messages,baseUrl:book.getUrl()};console.log(JSON.stringify(result));return result;
    }finally{lock.releaseLock();}
  }
  return {run:run};
})();
function detectarFuentes(){return Discovery.run();}
function prepararProyecto(){var base=configurarProyecto();var discovery=detectarFuentes();return {base:base,discovery:discovery};}
