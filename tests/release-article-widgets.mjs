// Scoped release: preserve every live module except the article renderer.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { transform as compile } from '@astrojs/compiler-rs';
import { transform } from 'esbuild';
import { experimental_AstroContainer } from 'astro/container';
const dir = 'output/article-widgets-release-20260928';
fs.mkdirSync(dir, { recursive: true });
const auth = JSON.parse(execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'auth', 'token', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const base = 'https://api.cloudflare.com/client/v4/accounts/69cf49e05bf0e858488c02392467bc2e/workers/scripts/ketoklar';
const headers = { Authorization: 'Bearer ' + auth.token };
async function download() {
  const response = await fetch(base, { headers });
  assert(response.ok, 'Download failed: ' + response.status);
  const modules = [];
  for (const [name, part] of await response.formData()) {
    modules.push({ name, text: typeof part === 'string' ? part : await part.text(), type: part.type || 'application/javascript+module' });
  }
  return modules;
}
const digest = modules => createHash('sha256').update(JSON.stringify([...modules].sort((a,b)=>a.name.localeCompare(b.name)))).digest('hex');
if (process.argv.includes('--inspect')) {
  const old = JSON.parse(fs.readFileSync(dir+'/before.json','utf8'));
  const current = await download();
  console.log(JSON.stringify(current.filter(m=>!old.some(n=>n.name===m.name&&n.text===m.text)).map(m=>({name:m.name,widget:m.text.includes('enhanceArticleBlocks'),bytes:m.text.length})),null,2));
  fs.writeFileSync(dir+'/current-inspection.json',JSON.stringify(current));
  process.exit(0);
}
if (process.argv.includes('--deploy') || process.argv.includes('--rollback')) {
  const rollback = process.argv.includes('--rollback');
  const before = JSON.parse(fs.readFileSync(dir + (rollback ? '/after.json' : '/before.json'), 'utf8'));
  const after = JSON.parse(fs.readFileSync(dir + (rollback ? '/before.json' : '/after.json'), 'utf8'));
  assert.equal(digest(await download()), digest(before), 'Live site changed since preparation. Stop and prepare again.');
  const body = new FormData();
  for (const m of after) body.append(m.name, new Blob([m.text], {type:m.type}), m.name);
  body.append('metadata', new Blob([JSON.stringify({main_module:'entry.mjs'})], {type:'application/json'}));
  const response = await fetch(base + '/content', {method:'PUT', headers, body});
  const result = await response.json();
  assert(response.ok && result.success, JSON.stringify(result.errors));
  fs.writeFileSync(dir + '/deployment.json', JSON.stringify({success:true,result:result.result}, null, 2));
  assert.equal(digest(await download()), digest(after), 'Post-deploy module verification failed');
  console.log(rollback ? 'Original live modules restored and verified.' : 'Deployed and verified: one article renderer updated; three widget modules added. All other live modules preserved.');
} else {
  const before = await download();
  const targets = before.filter(m => m.text.includes('const contents = blocks.flatMap') && m.text.includes('parseArticleBody(article.body)'));
  assert.equal(targets.length, 1);
  const target = targets[0];
  const prefix = target.name.slice(0, target.name.lastIndexOf('/') + 1);
  const serverPath = target.text.match(/from "(\.\/server_[^"]+)"/)[1];
  const compilerPath = target.text.match(/from "(\.\/compiler_[^"]+)"/)[1];
  const mappings = {render:'d',createAstro:'C',maybeRenderHead:'f',unescapeHTML:'b',addAttribute:'m',renderComponent:'i',spreadAttributes:'t'};
  const additions = [];
  for (const name of ['ArticleShoppingList','ArticleMealCards']) {
    const source = fs.readFileSync('src/components/' + name + '.astro','utf8');
    const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1] || '';
    const compiled = compile(source.replace(/<script>[\s\S]*?<\/script>/,''), {filename:name+'.astro'});
    let code = compiled.code.replace(/import \{ ([^\n]+) \} from "astro\/runtime\/server\/index.js";/, (_, names) => {
      return names.split(', ').map(pair => {
        const [original,alias] = pair.split(' as ');
        if (original === 'createMetadata') return 'const '+alias+'=()=>({});';
        if (original === 'createComponent') return `import {t as ${alias}} from ${JSON.stringify(compilerPath)};`;
        assert(mappings[original], 'Unknown runtime export: '+original);
        return `import {${mappings[original]} as ${alias}} from ${JSON.stringify(serverPath)};`;
      }).join('\n');
    }).replace(/^import ".*\?astro&type=style.*";\n/gm,'');
    const client = (await transform(script,{loader:'ts'})).code;
    if (!code.includes('as $$unescapeHTML')) code = `import {b as $$unescapeHTML} from ${JSON.stringify(serverPath)};\n` + code;
    const assets = '<style>'+compiled.css.join('\n')+'</style>'+(client ? '<script type="module">'+client+'</script>' : '');
    code = code.replace('return $$render`', () => 'return $$render`${$$unescapeHTML('+JSON.stringify(assets)+')}');
    code = (await transform(code,{loader:'ts',format:'esm'})).code;
    const smokeCode = code.replace(/import \{ (\w+) as (\$\$\w+) \} from "(\.\/[^\"]+)";/g, (_, symbol, alias, path) => {
      const original = path === compilerPath ? 'createComponent' : Object.keys(mappings).find(k=>mappings[k]===symbol);
      assert(original, 'Unknown smoke-test import');
      return `import {${original} as ${alias}} from ${JSON.stringify(import.meta.resolve('astro/runtime/server/index.js'))};`;
    });
    const component = await import('data:text/javascript;base64,'+Buffer.from(smokeCode).toString('base64'));
    const container = await experimental_AstroContainer.create();
    const html = await container.renderToString(component.default,{props:name==='ArticleShoppingList'?{items:['<strong>Protein:</strong> Æg, kylling.']}:{items:[{title:'Test',html:'Indhold'}],kind:'lunch'}});
    assert(html.includes(name==='ArticleShoppingList'?'data-shopping-list':'meal-card'));
    additions.push({name:prefix+name+'_20260928.mjs',text:code,type:'application/javascript+module'});
  }
  const helper = (await transform(fs.readFileSync('src/lib/articleEnhancements.ts','utf8'),{loader:'ts',format:'esm'})).code;
  additions.push({name:prefix+'articleEnhancements_20260928.mjs',text:helper,type:'application/javascript+module'});
  let updated = target.text;
  const imports = 'import ArticleShoppingList from "./ArticleShoppingList_20260928.mjs";\nimport ArticleMealCards from "./ArticleMealCards_20260928.mjs";\nimport {enhanceArticleBlocks} from "./articleEnhancements_20260928.mjs";\n';
  updated = imports + updated;
  const oldBlocks = 'const blocks = isLocked ? [] : parseArticleBody(article.body);\n\tconst contents';
  assert.equal(updated.split(oldBlocks).length,2);
  updated = updated.replace(oldBlocks,'const blocks = isLocked ? [] : enhanceArticleBlocks(article.slug, parseArticleBody(article.body));\n\tconst contents');
  const oldMap = 'blocks.map((block, index) => {';
  assert.equal(updated.split(oldMap).length,2);
  updated = updated.replace(oldMap,()=>oldMap+'\nif(block.type === "shoppingChecklist") return renderComponent($$result, "ArticleShoppingList", ArticleShoppingList, {items:block.items});\nif(block.type === "mealCards") return renderComponent($$result, "ArticleMealCards", ArticleMealCards, {items:block.items,kind:block.kind});');
  const after = before.map(m => m === target ? {...m,text:updated} : m).concat(additions);
  assert.equal(before.filter(m=>after.find(n=>n.name===m.name).text!==m.text).length,1);
  fs.writeFileSync(dir+'/before.json',JSON.stringify(before));
  fs.writeFileSync(dir+'/after.json',JSON.stringify(after));
  for (const m of after.filter(m=>m.name===target.name||additions.includes(m))) {
    const file=dir+'/'+m.name.replaceAll('/','_');
    fs.writeFileSync(file,m.text);
    execFileSync(process.execPath,['--check',file]);
  }
  console.log('Prepared and syntax checked. Changed: '+target.name+'. Added: '+additions.length+'. No deployment yet.');
}
