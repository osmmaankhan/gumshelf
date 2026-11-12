const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {linkFor} = require('../lib/links.cjs');

test('release links allow only HTTPS on the specified support and repository hosts', () => {
 for (const url of ['https://ko-fi.com/maker', 'https://buymeacoffee.com/maker', 'https://gumroad.com/maker', 'https://maker.gumroad.com/l/support', 'https://github.com/maker/repo']) {
  assert.equal(linkFor('support', {support: url}), url);
 }
 for (const url of ['http://github.com/maker', 'https://github.com.evil.com/', 'https://evilgithub.com/', 'https://gumroad.com.evil.com/', 'https://fakeko-fi.com/', 'https://example.com/', 'file:///C:/test', 'javascript:alert(1)', 'https://user@github.com/', 'https://github.com@evil.com/', 'https://github.com./']) {
  assert.throws(() => linkFor('repo', {repo: url}), /Invalid link/);
 }
 assert.equal(linkFor('support', {support: '', repo: ''}), '');
 assert.throws(() => linkFor('https://github.com/', {}), /Invalid link key/);
 assert.throws(() => linkFor('__proto__', {}), /Invalid link key/);
});

test('rail and Settings actions share the key-only IPC and empty links open nothing', async () => {
 const source = fs.readFileSync(require.resolve('../app/app.js'), 'utf8');
 const ctx = vm.createContext({
  window: {matchMedia: () => ({addEventListener() {}})},
  document: {addEventListener() {}}, setTimeout, clearTimeout, setInterval() {}
 });
 vm.runInContext(source.slice(0, source.lastIndexOf('(async()=>')), ctx);
 const html = vm.runInContext('nav()', ctx);
 assert.match(html, /class="nav rail-link"[^>]*data-action="open-support"/);
 assert.match(html, /class="nav rail-link"[^>]*data-action="open-repo"/);
 assert.match(html, /Report an issue/);
 const calls = [];
 const context = {calls, require: name => {
  assert.equal(name, 'electron');
  return {contextBridge: {exposeInMainWorld: (_name, api) => { context.api = api; }}, ipcRenderer: {invoke: (...args) => calls.push(args)}};
 }};
 vm.runInNewContext(fs.readFileSync(require.resolve('../preload.cjs'), 'utf8'), context);
 context.api.openLink('repo');
 assert.deepEqual(calls, [['open-link', 'repo']]);
 // Exercise the real registered main-process handler with a fictional shell.
 const main = fs.readFileSync(require.resolve('../main.cjs'), 'utf8');
 const handler = main.match(/handle\('open-link',[^\n]+/)[0];
 let open;
 const opened = [];
 vm.runInNewContext(handler, {handle: (_name, fn) => { open = fn; }, LINKS: {support: '', repo: 'https://github.com/maker/repo'}, linkFor, shell: {openExternal: async url => opened.push(url)}});
 assert.equal((await open('support')).opened, false);
 assert.deepEqual(opened, []);
 assert.equal((await open('repo')).opened, true);
 assert.deepEqual(opened, ['https://github.com/maker/repo']);
 await assert.rejects(open('https://evil.com/'), /Invalid link key/);
 assert.match(source, /toast\('Link coming soon'\)/);
});
