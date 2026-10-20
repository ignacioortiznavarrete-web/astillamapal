/** Source access is read-only. This module never calls a write method. */
var SheetsReader = (function () {
  function date(value, zone) {
    if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, zone, 'yyyy-MM-dd');
    var s=String(value || '').trim(), m;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if ((m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
    return '';
  }
  function read(config) {
    var output={receipts:[],sap:[]};
    config.sources.forEach(function(source){
      var book=SpreadsheetApp.openById(source.id), zone=book.getSpreadsheetTimeZone();
      source.sheets.forEach(function(name){
        var sheet=book.getSheetByName(name);
        if(!sheet) throw new Error('No existe pestaña configurada: '+name);
        var start=source.headerRow || 1, last=sheet.getLastRow();
        if(last<start) throw new Error('Faltan encabezados: '+name);
        var range=sheet.getRange(start,1,last-start+1,sheet.getLastColumn()), values=range.getValues(), display=range.getDisplayValues();
        var headers=display.shift().map(Domain.key); values.shift(); var indices={};
        Object.keys(source.columns).forEach(function(k){var h=Domain.key(source.columns[k]); var at=headers.indexOf(h);if(at<0 || headers.lastIndexOf(h)!==at) throw new Error('Encabezado ausente o ambiguo '+h+' en '+name);indices[k]=at;});
        values.forEach(function(row,i){
          if(row.every(function(v){return v==='';})) return;
          var item={source:name,sourceRow:start+i+1};
          Object.keys(indices).forEach(function(k){item[k]=k==='date'?date(row[indices[k]],zone):k==='id'?display[i][indices[k]].trim():row[indices[k]];});
          output[source.kind].push(item);
        });
      });
    });
    return output;
  }
  return {read:read};
})();
