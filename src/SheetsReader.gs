/** All operations on source books are read-only. Full refresh observes edits, deletions and appended rows. */
var SheetsReader = (function () {
  function date(value,zone) {
    if(Object.prototype.toString.call(value)==='[object Date]'&&!isNaN(value.getTime()))return Utilities.formatDate(value,zone,'yyyy-MM-dd');
    var text=String(value==null?'':value).trim(),m;
    if((m=text.match(/^(\d{4}-\d{2}-\d{2})(?:[ T].*)?$/)))return m[1];
    if((m=text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})(?:\s.*)?$/)))return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
    return '';
  }
  function monthly(name){return /(?:ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|SETIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE).*20\d{2}/.test(Domain.key(name));}
  function read(config) {
    var output={receipts:[],sap:[],diagnostics:[],sheets:[],availability:{receipts:false,sap:false}},books=Object.create(null),seen=Object.create(null);
    function diagnostic(level,message){output.diagnostics.push({level:level,message:message});}
    config.sources.forEach(function(source){
      try {
        var book=books[source.id]||(books[source.id]=SpreadsheetApp.openById(source.id)),zone=book.getSpreadsheetTimeZone();
        var wildcard=source.sheets.indexOf('*')>=0;
        var sheets=wildcard?book.getSheets():source.sheets.map(function(name){if(config.period&&Period.outsideSheet(name,config.period))return null;var s=book.getSheetByName(name);if(!s)diagnostic('error','No existe pestaña '+name+' en '+source.id);return s;}).filter(Boolean);
        if(!wildcard&&source.kind==='receipts')book.getSheets().forEach(function(s){if(monthly(s.getName())&&!sheets.some(function(x){return x.getName()===s.getName();}))sheets.push(s);});
        sheets.forEach(function(sheet){
          var name=sheet.getName(),identity=JSON.stringify([source.id,name]);
          if(config.period&&Period.outsideSheet(name,config.period))return;
          if(seen[identity])return;
          if((config.disabled||[]).some(function(d){return d.id===source.id&&(d.name===name||d.name==='*');}))return;
          var explicit=!wildcard&&source.sheets.indexOf(name)>=0;
          if(!sheet.getLastRow()||!sheet.getLastColumn()){if(explicit)diagnostic('error',name+': hoja vacía, no se encontraron encabezados.');return;}
          try {
            var top=sheet.getRange(1,1,Math.min(50,sheet.getLastRow()),Math.min(200,sheet.getLastColumn())).getDisplayValues();
            var schema=Headers.resolve(top,source.id===config.receiptSourceId?Object.assign({},source,{kind:'receipts'}):source);
            if(schema.kind==='receipts'&&config.receiptSourceId&&source.id!==config.receiptSourceId){diagnostic('info',name+': omitida como complemento; se usa exclusivamente el archivo de recepciones indicado.');return;}
            if(source.acceptKinds&&source.acceptKinds.indexOf(schema.kind)<0)return;
            var count=sheet.getLastRow()-schema.row,valid=0,repeated=0,width=Math.max.apply(null,Object.keys(schema.indices).map(function(k){return schema.indices[k]+1;}));
            var sheetRows=[];
            var values=count?sheet.getRange(schema.row+1,1,count,width).getValues():[];
            var display=count?sheet.getRange(schema.row+1,1,count,width).getDisplayValues():[];
            values.forEach(function(row,i){
              if(row.every(function(v){return v==='';}))return;
              var ix=schema.indices;
              if(Headers.normalize(row[ix.supplier])===Headers.normalize(schema.headers[ix.supplier])&&Headers.normalize(row[ix.product])===Headers.normalize(schema.headers[ix.product])){repeated++;return;}
              var item={source:name,sourceId:source.id,sourceRow:schema.row+i+1};
              Object.keys(ix).forEach(function(k){item[k]=k==='date'?date(row[ix[k]],zone):(k==='id'||k==='guide')?display[i][ix[k]].trim():row[ix[k]];});
              if(config.period&&Domain.validDate(item.date)&&!Period.contains(item.date,config.period))return;
              if(schema.kind==='sap'&&item.unit && ['T','TO','TON','TONS','TS','TONELADA','TONELADAS','TNE'].indexOf(Domain.key(item.unit))<0 && ['ASTILLA VERDE','ASTILLA VERDE C/CORT'].indexOf(Domain.key(item.product))>=0)throw new Error('Unidad SAP '+item.unit+' no es TS. Corrija/convierta la base SAP independiente antes de cargar.');
              sheetRows.push(item);valid++;
            });
            if(source.kind==='auto')diagnostic('info',name+': clasificación automática '+schema.kind+' por encabezados.');
            output[schema.kind]=output[schema.kind].concat(sheetRows);
            seen[identity]=true;output.availability[schema.kind]=true;
            var mapping={};Object.keys(schema.indices).forEach(function(k){mapping[k]=schema.headers[schema.indices[k]];});
            output.sheets.push({id:source.id,name:name,kind:schema.kind,headerRow:schema.row,rows:valid,mapping:mapping});
            if(explicit&&source.headerRow&&source.headerRow!==schema.row)diagnostic('info',name+': encabezados detectados automáticamente en fila '+schema.row+'.');
            if(repeated)diagnostic('info',name+': '+repeated+' encabezados repetidos omitidos.');
          }catch(e){if(explicit||(top&&Headers.resembles(top)))diagnostic('error',name+': '+e.message);else if(source.kind!=='auto'&&monthly(name))diagnostic('error',name+': '+e.message);}
        });
      }catch(e){diagnostic('error','No se pudo leer '+source.id+': '+e.message);}
    });
    if(!output.availability.sap)diagnostic('warning','SAP no disponible: se estiman recepciones a 11,5 TS; cumplimiento SAP no disponible.');
    if(!output.availability.receipts)diagnostic('warning','Recepciones no disponibles: no se pueden estimar camiones pendientes.');
    output.complete=!output.diagnostics.some(function(d){return d.level==='error';});
    return output;
  }
  return {read:read,date:date,monthly:monthly};
})();
