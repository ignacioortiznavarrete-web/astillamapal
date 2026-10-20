/** Resolve real spreadsheet headers without renaming a single source cell. */
var Headers = (function () {
  var ALIASES = {
    date: ['FECHA CONTABILIZACION','FECHA DE CONTABILIZACION','FEC CONTABILIZACION','FECHA CONTAB','FEC CONTAB','FECHA DE CONTABILIZ','FE CONTABILIZACION','POSTING DATE','FECHA','FECHA DOCUMENTO','FECHA DE DOCUMENTO','DOCUMENT DATE','FECHA INGRESO','FECHA DE INGRESO','FECHA RECEPCION'],
    supplier: ['PROVEEDOR','NOMBRE PROVEEDOR','NOMBRE DEL PROVEEDOR','NOMBRE 1','NOMBRE ACREEDOR','SUPPLIER','VENDOR NAME'],
    product: ['PRODUCTO','TEXTO BREVE DE MATERIAL','TEXTO BREVE MATERIAL','DESCRIPCION MATERIAL','DESCRIPCION DEL MATERIAL','MATERIAL DESCRIPTION'],
    guide: ['N DE GUIA','N GUIA','NUMERO DE GUIA','NUMERO GUIA','GUIA','GUIA DE DESPACHO','NOTA DE ENTREGA','DELIVERY NOTE'],
    id: ['ID RECEPCION','ID DE RECEPCION'],
    tonnes: ['CANTIDAD','CANTIDAD EN UM ENTRADA','CANTIDAD EN UNIDAD DE ENTRADA','TONELADAS','TONELADAS NETAS','PESO NETO TS','QUANTITY'],
    unit: ['UNIDAD DE MEDIDA','UNIDAD MEDIDA','UM ENTRADA','UNIDAD MEDIDA ENTRADA','UME','UNIT']
  };
  function normalize(value) { return Domain.key(value).replace(/[º°ª]/g,'').replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' '); }
  function index(headers,field,configured) {
    var reference=String(configured||'').trim().match(/^@([A-Za-z]{1,3})$/);
    if(reference){var column=0;reference[1].toUpperCase().split('').forEach(function(c){column=column*26+c.charCodeAt(0)-64;});return column<=headers.length?column-1:-1;}
    var normalized=headers.map(normalize), wanted=configured?normalize(configured):'';
    // A configured exact name wins, but duplicates never pick an arbitrary column.
    if(wanted && normalized.indexOf(wanted)>=0) {
      var exact=normalized.indexOf(wanted);
      if(normalized.lastIndexOf(wanted)!==exact)throw new Error('Encabezado duplicado: '+configured+'. Seleccione su columna en FUENTES con @B, @C, etc.; no se eligió una columna al azar.');
      return exact;
    }
    var choices=ALIASES[field] || [];
    if(field==='date') {
      // SAP posting date is preferred over document date when FECHA is not explicitly available.
      var posting=['FECHA CONTABILIZACION','FECHA DE CONTABILIZACION','FEC CONTABILIZACION','FECHA CONTAB','FEC CONTAB','FECHA DE CONTABILIZ','FE CONTABILIZACION','POSTING DATE'];
      var postings=[];normalized.forEach(function(h,i){if(posting.indexOf(h)>=0)postings.push(i);});
      if(postings.length>1)throw new Error('Varias fechas de contabilización. Indique COL_FECHA para seleccionar una.');
      if(postings.length===1)return postings[0];
    }
    var matches=[];normalized.forEach(function(h,i){if(choices.indexOf(h)>=0)matches.push(i);});
    if(matches.length>1)throw new Error('Varias columnas posibles para '+field+'. Configure su nombre exacto en FUENTES.');
    return matches.length?matches[0]:-1;
  }
  function resolve(rows,source) {
    var columns=source.columns||{}, required=['date','supplier','product',columns.id&&!columns.guide?'id':'guide'];
    if(source.kind==='sap')required.push('tonnes');
    var candidates=[], errors=[];
    rows.forEach(function(headers,row){
      var indices={},recognized=0;
      try {
        required.forEach(function(field){indices[field]=index(headers,field,columns[field]);if(indices[field]>=0)recognized++;});
        if(source.kind==='auto') {
          var qty=index(headers,'tonnes',columns.tonnes);if(qty>=0)indices.tonnes=qty;
        }
        if(recognized===required.length) {
          var kind=source.kind==='auto'?(indices.tonnes>=0?'sap':'receipts'):source.kind;
          var unit=index(headers,'unit',columns.unit);if(unit>=0)indices.unit=unit;
          candidates.push({row:row+1,indices:indices,kind:kind,headers:headers});
        }
      }catch(e){errors.push({row:row+1,message:e.message});}
    });
    if(!candidates.length) {
      var ranked=rows.map(function(r,i){var score=0;['date','supplier','product','guide','tonnes'].forEach(function(k){try{if(index(r,k,columns[k])>=0)score++;}catch(e){score++;}});return {row:i+1,headers:r,score:score};}).sort(function(a,b){return b.score-a.score;});
      var best=ranked[0]||{row:0,headers:[]},observed=best.headers.map(function(v){return String(v).trim().slice(0,65);}).filter(Boolean);
      throw new Error((errors.length?errors[0].message:'No se identificaron fecha, proveedor, producto y guía'+(source.kind==='sap'?' y Cantidad':'')+'.')+' Fila candidata '+best.row+'. Encabezados observados: '+observed.slice(0,24).join(' | '));
    }
    var preferred=candidates.filter(function(c){return c.row===source.headerRow;});
    return preferred.length?preferred[0]:candidates[0];
  }
  function resembles(rows){return rows.some(function(row){var fields=0;['supplier','product','guide','tonnes'].forEach(function(k){try{if(index(row,k,'')>=0)fields++;}catch(e){fields++;}});return fields>=3;});}
  return {normalize:normalize,index:index,resolve:resolve,resembles:resembles};
})();
