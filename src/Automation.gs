/** Time-based refresh: no source edit triggers, no writes or permission changes on originals. */
var Automation=(function(){
  function install(){
    var lock=LockService.getScriptLock();lock.waitLock(10000);
    try {
      var owned=ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='sincronizacionProgramada';});
      if(!owned.length)ScriptApp.newTrigger('sincronizacionProgramada').timeBased().everyMinutes(15).create();
      owned.slice(1).forEach(function(t){ScriptApp.deleteTrigger(t);});
      PropertiesService.getScriptProperties().setProperties({AUTO_SYNC_ENABLED:'true'});
      return {enabled:true,minutes:15};
    }finally{lock.releaseLock();}
  }
  return {install:install};
})();
function activarAutomatico(){var prepared=prepararProyecto();var automation=Automation.install();var sync;try{sync=syncProcessed();}catch(e){sync={error:e.message};}var result={base:prepared.base,automation:automation,sync:sync};console.log(JSON.stringify(result));return result;}
function sincronizacionProgramada(){try{return syncProcessed();}catch(e){console.error(e.message);throw e;}}
function desactivarAutomatico(){ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='sincronizacionProgramada';}).forEach(function(t){ScriptApp.deleteTrigger(t);});PropertiesService.getScriptProperties().setProperties({AUTO_SYNC_ENABLED:'false'});}
