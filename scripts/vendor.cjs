const fs=require('node:fs');
const css=fs.readFileSync(require.resolve('bootstrap/dist/css/bootstrap.min.css'),'utf8').replace(/\/\*# sourceMappingURL=.*?\*\//g,'');
const chart=fs.readFileSync(require('node:path').join(require('node:path').dirname(require.resolve('chart.js')),'chart.umd.js'),'utf8').replace(/\/\/# sourceMappingURL=.*$/gm,'');
fs.writeFileSync('src/Bootstrap.html','<style>\n'+css+'\n</style>\n');
fs.writeFileSync('src/Chart.html','<script>\n'+chart.replace(/<\/script/gi,'<\\/script')+'\n</script>\n');
console.log('Bootstrap 5 y Chart.js incluidos en archivos Apps Script.');
