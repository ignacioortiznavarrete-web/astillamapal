/** Run configurarProyecto once from the Apps Script editor. Never writes to source files. */
var Setup = (function () {
  var SOURCE_IDS=['1tOsKaZfFQIbnGxd_q89LjW5eM5hcReErw582gFCayGI','1jtF5B1DUQdx6eCWuFIp7k86suCY8XeBJ6_RoNJ3Bg-A'];
  var SCHEMAS={
    PROVEEDORES:['NOMBRE_ORIGEN','PROVEEDOR_OFICIAL'],
    PLAN_MENSUAL:['MES','PROVEEDOR','PRODUCTO','PLAN_TS','PRECIO_TS'],
    FUENTES:['ACTIVA','TIPO','ARCHIVO_ID','PESTANA','FILA_ENCABEZADOS','COL_FECHA','COL_PROVEEDOR','COL_PRODUCTO','COL_GUIA','COL_CANTIDAD'],
    ASTILLA_PROCESADO:['ID','FECHA','PROVEEDOR','PRODUCTO','TONELADAS','ESTADO','PROMEDIO_RESPALDO'],
    RESUMEN_MENSUAL:['MES','PROVEEDOR','PRODUCTO','CAMIONES_PENDIENTES','TS_ESTIMADAS','TS_SAP','PLAN_TS','CUMPLIMIENTO_SAP_PCT','COBERTURA_CON_ESTIMADO_PCT'],
    INGRESOS_POR_MES:['ANO','PROVEEDOR','PRODUCTO','TIPO','ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'],
    PROVEEDORES_PENDIENTES:['NOMBRE_ORIGEN'],
    ALERTAS_GUIAS:['MES','PROVEEDOR','GUIA','CANTIDAD_CAMIONES','FILAS_ORIGEN','ALERTA'],
    DIAGNOSTICO:['FECHA','NIVEL','MENSAJE']
  };
  function ensure(book,name,headers){
    var sheet=book.getSheetByName(name);
    if(!sheet) sheet=book.insertSheet(name);
    if(sheet.getLastRow()) {
      if(sheet.getRange(1,1,1,headers.length).getDisplayValues()[0].join('|')!==headers.join('|')) throw new Error('Encabezados inesperados en '+name+'. Se conservaron los datos.');
      return sheet;
    }
    sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground('#164f37').setFontColor('#ffffff');
    sheet.setFrozenRows(1); sheet.autoResizeColumns(1,headers.length);
    return sheet;
  }
  function sourceIds(p){
    var raw=p.getProperty('SOURCES_JSON'), ids=SOURCE_IDS.slice();
    if(raw) JSON.parse(raw).forEach(function(s){ids.push(s.id);});
    return ids;
  }
  function base(){
    var p=PropertiesService.getScriptProperties(), id=p.getProperty('PROCESSED_SPREADSHEET_ID');
    if(id && sourceIds(p).indexOf(id)>=0) throw new Error('La base configurada coincide con una fuente. No se modificó.');
    if(id && p.getProperty('ASTILLA_MANAGED_BASE_ID')!==id) throw new Error('Base no creada por el asistente. Para conservarla, retire PROCESSED_SPREADSHEET_ID y ejecute nuevamente: se creará otra base.');
    var book;
    if(!id){book=SpreadsheetApp.create('ASTILLA MAPAL · Base independiente');id=book.getId();p.setProperties({PROCESSED_SPREADSHEET_ID:id,ASTILLA_MANAGED_BASE_ID:id});}
    else book=SpreadsheetApp.openById(id);
    Object.keys(SCHEMAS).forEach(function(name){ensure(book,name,SCHEMAS[name]);});
    return book;
  }
  function configure(){
    var lock=LockService.getScriptLock();lock.waitLock(10000);
    try {var book=base();
      var result={baseId:book.getId(),url:book.getUrl(),sheets:Object.keys(SCHEMAS)};console.log(JSON.stringify(result));return result;}
    finally{lock.releaseLock();}
  }
  return {configure:configure,ensure:ensure,schemas:SCHEMAS,sourceIds:SOURCE_IDS};
})();
function configurarProyecto(){return Setup.configure();}
