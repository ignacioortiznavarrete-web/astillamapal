var Config = (function () {
  function spreadsheetId(value){var text=String(value||'').trim(),m=text.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);return m?m[1]:text;}
  function placeholder(value){return /CONFIRMAR_|COMPLETAR_|REEMPLAZAR_|ID_PLANILLA|NOMBRE_PESTA/i.test(String(value||''));}
  function read() {
    var p=PropertiesService.getScriptProperties(),storeId=p.getProperty('PROCESSED_SPREADSHEET_ID'),raw=p.getProperty('SOURCES_JSON'),declared=raw?JSON.parse(raw):[],warnings=[];
    if(!Array.isArray(declared))throw new Error('SOURCES_JSON debe ser una lista.');
    if(storeId&&(Setup.sourceIds.indexOf(storeId)>=0||declared.some(function(s){return spreadsheetId(s.id)===storeId;})))throw new Error('La base procesada debe ser independiente de todas las fuentes.');
    var workspace=Workspace.load(storeId),configured=workspace.sources.length?workspace.sources:declared;
    var sources=configured.filter(function(s){if(placeholder(s.id)||!s.id){warnings.push('Se ignoró una fuente de ejemplo sin ID real.');return false;}return true;});
    sources=sources.map(function(s){
      var source=Object.assign({},s,{id:spreadsheetId(s.id),kind:Domain.key(s.kind).toLowerCase(),columns:s.columns||{}});
      if(!source.sheets||!source.sheets.length||source.sheets.some(placeholder))source.sheets=['*'];
      if(['receipts','sap','auto'].indexOf(source.kind)<0)throw new Error('TIPO debe ser receipts o sap.');
      if(source.headerRow!==undefined&&(!Number.isInteger(source.headerRow)||source.headerRow<1))source.headerRow=undefined;
      if(source.id===storeId)throw new Error('Escritura en fuente prohibida.');
      return source;
    });
    var identities=Object.create(null);
    sources.forEach(function(s){s.sheets.forEach(function(name){var key=JSON.stringify([s.id,name]);if(identities[key]&&identities[key]!==s.kind)throw new Error('La misma pestaña está configurada como receipts y sap: '+name);identities[key]=s.kind;});});
    // No manual setup needed for known sources. Disabled real tabs remain disabled.
    if(!sources.length)Setup.sourceIds.forEach(function(id){sources.push({id:id,kind:'auto',sheets:['*'],columns:{}});});
    var suppliers=JSON.parse(p.getProperty('SUPPLIERS_JSON')||'[]').concat(workspace.suppliers);Suppliers.build(suppliers);
    return {sources:sources,storeId:storeId,suppliers:suppliers,plans:workspace.plans,disabled:(workspace.disabled||[]).map(function(d){return {id:spreadsheetId(d.id),name:d.name};}),configWarnings:warnings};
  }
  return {read:read,spreadsheetId:spreadsheetId,placeholder:placeholder};
})();
