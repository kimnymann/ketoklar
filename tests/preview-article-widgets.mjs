// Local-only preview of the real Astro components, without production data writes.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { transform as compile } from '@astrojs/compiler-rs';
import { transform } from 'esbuild';
import { experimental_AstroContainer } from 'astro/container';
import { parseArticleBody } from '../src/lib/articleBody.ts';

const container = await experimental_AstroContainer.create();
const blocks = parseArticleBody(readFileSync('docs/laesekopier/keto-travl-hverdag-indkoeb-madpakker.md','utf8'));
const list=blocks.find(b=>b.type==='list' && b.items[0].includes('Protein:'));
async function render(name,props) {
  const raw=readFileSync('src/components/'+name+'.astro','utf8');
  const script=raw.match(/<script>([\s\S]*?)<\/script>/)?.[1]??'';
  const compiled=compile(raw.replace(/<script>[\s\S]*?<\/script>/,''),{filename:name+'.astro'});
  const code=compiled.code.replace(/^import ".*\?astro&type=style.*";\n/gm,'').replace(', createMetadata as $$createMetadata','').replace('"astro/runtime/server/index.js"',JSON.stringify(import.meta.resolve('astro/runtime/server/index.js')));
  const js=await transform('const $$createMetadata = () => ({});\n'+code,{loader:'ts',format:'esm'});
  const component=await import('data:text/javascript;base64,'+Buffer.from(js.code).toString('base64'));
  const html=await container.renderToString(component.default,{props});
  const client=await transform(script,{loader:'ts'});
  return '<style>'+compiled.css.join('\n')+'</style>'+html+'<script>'+client.code+'</script>';
}
const meals=[];
for(const kind of ['lunch','dinner']) {
  const heading=kind==='lunch'?'Tre madpakker uden brødbagning':'Tre hurtige aftensmåltider';
  const i=blocks.findIndex(b=>b.type==='heading'&&b.text===heading);
  const items=blocks.slice(i+1,i+4).map(b=>{const m=b.html.match(/^<strong>([^<]+)<\/strong>\s*([\s\S]+)$/);return {title:m[1].replace(/^Madpakke \d+: /,'').replace(/[.:]$/,''),html:m[2]};});
  meals.push('<h2>'+heading+'</h2>'+await render('ArticleMealCards',{items,kind}));
}
const html='<!doctype html><html lang="da"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Ketoklar – forhåndsvisning</title><style>*{box-sizing:border-box}body{margin:0;background:#faf7ee;color:#183c30;font-family:Arial,sans-serif;line-height:1.6}main{max-width:800px;padding:24px;margin:auto}:root{--font-display:Georgia,serif;--rust:#aa5239}h1,h2{font-family:Georgia,serif}h2{margin-top:40px}a{color:#864326}p{margin:0}</style><main><h1>Keto i en travl hverdag</h1><h2>En basisindkøbsliste</h2>'+await render('ArticleShoppingList',{items:list.items})+meals.join('')+'</main></html>';
createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);}).listen(4329,'127.0.0.1',()=>console.log('Preview http://127.0.0.1:4329'));
