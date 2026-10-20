/** Pure business rules. No Google services or writes. */
var Domain = (function () {
  var PRODUCTS = ['ASTILLA VERDE', 'ASTILLA VERDE C/CORT'];
  function key(value) { return String(value == null ? '' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toUpperCase(); }
  function tonnes(value) {
    if (typeof value === 'number') return value;
    var text = String(value == null ? '' : value).trim();
    if (!text) return NaN;
    if (text.indexOf(',') >= 0) text = text.replace(/\./g, '').replace(',', '.');
    return Number(text);
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var parsed = new Date(value+'T00:00:00Z');
    return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
  }
  function receptionId(supplier, guide) {
    var supplierKey = key(supplier), guideKey = key(guide);
    return supplierKey && guideKey ? JSON.stringify([supplierKey, guideKey]) : "";
  }
  function calculate(receipts, sap, filters) {
    function identify(row) {
      return Object.prototype.hasOwnProperty.call(row, "guide") ? Object.assign({}, row, {id:receptionId(row.supplier, row.guide)}) : row;
    }
    receipts = receipts.map(identify);
    sap = sap.map(identify);
    filters = filters || {};
    var warnings = [], seen = {}, booked = {}, averages = {}, pending = [], actual = [];
    function valid(row, kind) {
      if (PRODUCTS.indexOf(key(row.product)) < 0) return false;
      if (!row.id || !row.supplier || !validDate(row.date)) {
        warnings.push(kind + ': fila excluida por ID, proveedor o fecha ausente/inválida.'); return false;
      }
      return true;
    }
    // SAP must contain one row per reception/truck, with total net tonnes.
    sap.forEach(function (row) {
      if (!valid(row, 'SAP')) return;
      var id = key(row.id), weight = tonnes(row.tonnes);
      if (!Number.isFinite(weight) || weight <= 0) { warnings.push('SAP: tonelaje inválido para ' + id); return; }
      if (booked[id]) {
        if (booked[id].date !== row.date || booked[id].tonnes !== weight || key(booked[id].supplier) !== key(row.supplier) || key(booked[id].product) !== key(row.product)) throw new Error('SAP contiene registros contradictorios para recepción ' + id);
        warnings.push('SAP: duplicado omitido ' + id); return;
      }
      var item = Object.assign({}, row, {id:id, tonnes:weight, product:key(row.product), supplier:key(row.supplier), status:'SAP'});
      booked[id] = item;
      if ((!filters.from || row.date >= filters.from) && (!filters.to || row.date <= filters.to)) {
        var supplier = key(row.supplier);
        if (!averages[supplier]) averages[supplier] = {tonnes:0, trucks:0};
        averages[supplier].tonnes += weight; averages[supplier].trucks++;
      }
      actual.push(item);
    });
    receipts.forEach(function (row) {
      if (!valid(row, 'Recepción')) return;
      var id = key(row.id);
      if (seen[id]) {
        if (key(seen[id].supplier) !== key(row.supplier) || key(seen[id].product) !== key(row.product) || seen[id].date !== row.date) throw new Error('Recepciones contradictorias para ' + id);
        warnings.push('Recepción: duplicado omitido ' + id); return;
      }
      seen[id] = row;
      if (booked[id]) {
        if (booked[id].supplier !== key(row.supplier) || booked[id].product !== key(row.product)) throw new Error('Proveedor o producto no coincide con SAP para ' + id);
        return;
      }
      var avg = averages[key(row.supplier)];
      pending.push(Object.assign({}, row, {id:id, supplier:key(row.supplier), product:key(row.product), tonnes:avg ? avg.tonnes / avg.trucks : 11.5, fallback:!avg, status:'ESTIMADO'}));
    });
    function matches(row) {
      return (!filters.from || row.date >= filters.from) && (!filters.to || row.date <= filters.to) && (!filters.supplier || row.supplier === key(filters.supplier)) && (!filters.product || row.product === key(filters.product));
    }
    var all = pending.concat(actual), rows = all.filter(matches).sort(function(a,b){return b.date.localeCompare(a.date);});
    var groups = {};
    rows.forEach(function(row){ if (!groups[row.supplier]) groups[row.supplier]={supplier:row.supplier, estimated:0, sap:0, trucks:0}; var g=groups[row.supplier]; g.trucks++; g[row.status==='SAP'?'sap':'estimated']+=row.tonnes; });
    return {rows:rows, suppliers:Array.from(new Set(all.map(function(r){return r.supplier;}))).sort(), groups:Object.keys(groups).map(function(k){return groups[k];}), warnings:warnings, averages:averages,
      kpis:{trucks:rows.length, pending:rows.filter(function(r){return r.status==='ESTIMADO';}).length, estimated:rows.reduce(function(s,r){return s+(r.status==='ESTIMADO'?r.tonnes:0);},0), sap:rows.reduce(function(s,r){return s+(r.status==='SAP'?r.tonnes:0);},0)}};
  }
  return {calculate:calculate, key:key, tonnes:tonnes, receptionId:receptionId};
})();
