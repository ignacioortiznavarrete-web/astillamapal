const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
function createServer(){
  const src=path.resolve(__dirname,'../src');
  return http.createServer((req,res)=>{
    if(req.url!=='/'){res.writeHead(404);res.end();return;}
    let html=fs.readFileSync(path.join(src,'Index.html'),'utf8');
    html=html.replace(/<\?!= include_\('(Styles|Client|Bootstrap|Chart)'\); \?>/g,(_,name)=>fs.readFileSync(path.join(src,name+'.html'),'utf8'));
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);
  });
}
if(require.main===module)createServer().listen(8080,'127.0.0.1',()=>console.log('Vista de demostración disponible en puerto 8080'));
module.exports={createServer};
