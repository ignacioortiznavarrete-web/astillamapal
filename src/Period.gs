/** Calendar periods are always evaluated in Chile, independent of browser/server timezone. */
var Period=(function(){
  function forMonth(month){
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('Mes inválido.');
    return {month:month,from:month+'-01',to:new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10)};
  }
  function current(now){
    now=now||new Date();var month;
    if(typeof Utilities!=='undefined')month=Utilities.formatDate(now,'America/Santiago','yyyy-MM');
    else {var parts=new Intl.DateTimeFormat('en',{timeZone:'America/Santiago',year:'numeric',month:'2-digit'}).formatToParts(now);var values={};parts.forEach(function(p){values[p.type]=p.value;});month=values.year+'-'+values.month;}
    return forMonth(month);
  }
  function contains(date,range){return (!range.from||date>=range.from)&&(!range.to||date<=range.to);}
  function keep(row,range){return !Domain.validDate(row.date)||contains(row.date,range);}
  function select(data,range){return Object.assign({},data,{receipts:data.receipts.filter(function(r){return keep(r,range);}),sap:data.sap.filter(function(r){return keep(r,range);})});}
  function sheetMonth(name){
    var s=Domain.key(name),year=s.match(/\b(20\d{2})\b/),months=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    if(!year)return null;
    for(var i=0;i<months.length;i++)if(new RegExp('\\b'+months[i]+'\\b').test(s)||(i===8&&/\bSETIEMBRE\b/.test(s)))return year[1]+'-'+String(i+1).padStart(2,'0');
    var iso=s.match(/\b(20\d{2})[- /](0[1-9]|1[0-2])\b/);return iso?iso[1]+'-'+iso[2]:null;
  }
  function outsideSheet(name,range){var month=sheetMonth(name);return !!(month&&((range.from&&month<range.from.slice(0,7))||(range.to&&month>range.to.slice(0,7))));}
  function keepPlan(plan,range){var month=String(plan.month);return !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!((range.from&&month<range.from.slice(0,7))||(range.to&&month>range.to.slice(0,7)));}
  return {current:current,forMonth:forMonth,contains:contains,select:select,sheetMonth:sheetMonth,outsideSheet:outsideSheet,keepPlan:keepPlan};
})();
