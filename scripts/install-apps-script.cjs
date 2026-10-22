/* Runs on the user's computer. No Google credentials are included in the repository. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const SCRIPT_ID='1FXTFYvkWOe04nofW_2yzT4jj2eAWKAJSpWb3yaBP-Q_2Ei0r4fcFIaVb';
function files(directory){
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(directory,entry.name)): [path.join(directory,entry.name)]);
}
function snapshot(directory){
  const contents=new Map();
  for(const file of files(directory)){
    const relative=path.relative(directory,file).replace(/\\/g,'/');
    if(!/\.(gs|js|html|json)$/.test(relative))continue;
    const key=relative.replace(/\.gs$/,'.js');
    if(contents.has(key))throw Error('Nombre de archivo duplicado: '+key);
    let text=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n').trimEnd();
    if(relative==='appsscript.json')text=JSON.stringify(sort(JSON.parse(text)));
    contents.set(key,text);
  }
  return contents;
}
function sort(value){if(Array.isArray(value))return value.map(sort);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])]));return value;}
function validBackup(directory){
  const data=snapshot(directory);
  if(!data.has('appsscript.json')||![...data.keys()].some(k=>/\.(js|html)$/.test(k)))throw Error('La copia recibida está incompleta. No se subirá ningún archivo.');
  return data;
}
function equalSnapshot(expected,received){
  if(expected.size!==received.size)return false;
  return [...expected].every(([name,content])=>received.get(name)===content);
}
function execute(executable,args,cwd){
  const result=spawnSync(executable,args,{cwd,stdio:'inherit',shell:false});
  if(result.error)throw result.error;
  if(result.status!==0)throw Error('La operación no se completó (código '+result.status+').');
}
function install(options={}){
  const root=path.resolve(options.root||path.join(__dirname,'..')),run=options.run||execute,log=options.log||console.log;
  const configPath=path.join(root,'.clasp.json');
  if(fs.existsSync(configPath)&&JSON.parse(fs.readFileSync(configPath,'utf8')).scriptId!==SCRIPT_ID)throw Error('Esta carpeta está vinculada a otro proyecto. Se conservó su configuración. Extraiga una descarga nueva.');
  const expected=validBackup(path.join(root,'src'));
  const pkgPath=path.join(root,'node_modules','@google','clasp','package.json');
  const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
  const cli=path.resolve(path.dirname(pkgPath),typeof pkg.bin==='string'?pkg.bin:pkg.bin.clasp);
  const clasp=(args,cwd=root)=>run(process.execPath,[cli,'-u','astilla-mapal',...args],cwd);
  run(process.execPath,[path.join(root,'scripts','check.cjs')],root);
  log('1/4 Autorice con su cuenta de Google en la ventana que se abrirá.');
  clasp(['login']);
  const parent=path.join(root,'local-backups');fs.mkdirSync(parent,{recursive:true});
  const backup=fs.mkdtempSync(path.join(parent,'apps-script-'));
  const configure=folder=>{fs.mkdirSync(path.join(folder,'src'),{recursive:true});fs.writeFileSync(path.join(folder,'.clasp.json'),JSON.stringify({scriptId:SCRIPT_ID,rootDir:'src'},null,2)+'\n');};
  configure(backup);
  log('2/4 Guardando una copia del código actual antes de realizar cambios…');
  try{clasp(['pull'],backup);}catch(e){throw Error('No se pudo respaldar el proyecto; NO se subió código. Compruebe la cuenta y active Google Apps Script API en https://script.google.com/home/usersettings . '+e.message);}
  const original=validBackup(path.join(backup,'src'));
  fs.writeFileSync(path.join(backup,'RESPALDO.json'),JSON.stringify({scriptId:SCRIPT_ID,createdAt:new Date().toISOString(),files:[...original].map(([name,content])=>({name,sha256:crypto.createHash('sha256').update(content).digest('hex')}))},null,2)+'\n');
  configure(root);
  log('3/4 Subiendo todos los archivos al proyecto ASTILLA MAPAL…');
  try{clasp(['push','--force']);}catch(e){throw Error('No se confirmó la subida. La copia anterior está en '+backup+'. '+e.message);}
  const verification=path.join(backup,'verification');configure(verification);
  log('4/4 Volviendo a descargar para verificar que el código coincide…');
  try{clasp(['pull'],verification);if(!equalSnapshot(expected,validBackup(path.join(verification,'src'))))throw Error('El código descargado no coincide con la versión preparada.');}
  catch(e){throw Error('La subida se realizó, pero su verificación no terminó. Copia anterior: '+backup+'. '+e.message);}
  log('\nARCHIVOS ACTUALIZADOS Y VERIFICADOS.');log('Respaldo del código anterior: '+backup);
  log('Se abrirá Apps Script. Seleccione activarAutomatico y pulse Ejecutar. Después publique una Nueva versión de la implementación. No necesita copiar ni pegar código.');
  try{clasp(['open-script']);}catch(e){log('Abra el proyecto: https://script.google.com/home/projects/'+SCRIPT_ID+'/edit');}
  return {scriptId:SCRIPT_ID,backup,verified:true};
}
if(require.main===module){try{install();}catch(e){console.error('\nNo se completó la instalación: '+e.message);process.exitCode=1;}}
module.exports={install,snapshot,validBackup,equalSnapshot,SCRIPT_ID};
