/** Explicit supplier master. No fuzzy matches: different businesses must not be merged. */
var Suppliers = (function () {
  function build(definitions) {
    if (!Array.isArray(definitions)) throw new Error('SUPPLIERS_JSON debe ser una lista.');
    var aliases=Object.create(null);
    definitions.forEach(function(entry){
      var official=Domain.key(entry.name);
      if(!official || !Array.isArray(entry.aliases)) throw new Error('Homologación incompleta: name y aliases son obligatorios.');
      [entry.name].concat(entry.aliases).forEach(function(alias){
        var normalized=Domain.key(alias);
        if(!normalized) throw new Error('Alias de proveedor vacío.');
        if(aliases[normalized] && aliases[normalized]!==official) throw new Error('Alias asignado a dos proveedores: '+normalized);
        aliases[normalized]=official;
      });
    });
    return aliases;
  }
  function normalize(data, definitions) {
    var aliases=build(definitions), unknown=Object.create(null);
    function convert(row){
      var original=Domain.key(row.supplier), official=aliases[original];
      if(original && !official && ['ASTILLA VERDE','ASTILLA VERDE C/CORT'].indexOf(Domain.key(row.product))>=0) unknown[original]=true;
      return Object.assign({},row,{supplierOriginal:String(row.supplier || ''),supplier:official || original});
    }
    return {receipts:data.receipts.map(convert),sap:data.sap.map(convert),unmapped:Object.keys(unknown).sort()};
  }
  function calculate(data, definitions, filters){
    var normalized=normalize(data,definitions), result=Domain.calculate(normalized.receipts,normalized.sap,filters);
    result.unmappedSuppliers=normalized.unmapped;
    if(normalized.unmapped.length) result.warnings.push('Proveedores sin homologar (se mantienen separados): '+normalized.unmapped.join(', '));
    return result;
  }
  return {build:build,normalize:normalize,calculate:calculate};
})();
