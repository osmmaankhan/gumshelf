const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {BrowserBridge} = require('../lib/browser-bridge.cjs');

async function fixture(t) {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gumshelf-helper-'));
 const bridge = new BrowserBridge(dir);
 await bridge.start(0);
 const state = {};
 const routes = [];
 const origin = 'chrome-extension://' + 'a'.repeat(32);
 const chrome = {
  storage: {local: {
   get: async () => ({...state}),
   set: async patch => Object.assign(state, patch),
   remove: async key => { delete state[key]; }
  }},
  runtime: {onMessage: {addListener() {}}, onStartup: {addListener() {}}},
  alarms: {create() {}, onAlarm: {addListener() {}}}
 };
 const timers = new Set();
 const ctx = vm.createContext({
  chrome, importScripts() {}, crypto: globalThis.crypto, TextEncoder, URL,
  AbortController, clearTimeout, setInterval, clearInterval,
  setTimeout(fn, ms) { const timer = setTimeout(fn, ms); timers.add(timer); return timer; },
  fetch: async (url, options) => {
   const route = new URL(url).pathname;
   routes.push(route);
   return fetch('http://127.0.0.1:' + bridge.port + route, {
    ...options, headers: {...options.headers, Origin: origin}
   });
  }
 });
 vm.runInContext(fs.readFileSync(require.resolve('../extension/worker.js'), 'utf8'), ctx);
 // Page execution is fictional. Pairing, HMAC, polling and results use the actual worker.
 vm.runInContext("execute=async()=>({results:[],pagination:{page:1,pages:0,count:0}})", ctx);
 t.after(async () => {
  delete state.token;
  for (const timer of timers) clearTimeout(timer);
  bridge.disconnect();
  await new Promise(resolve => bridge.server.close(resolve));
  fs.rmSync(dir, {recursive: true, force: true});
 });
 return {bridge, state, ctx, routes};
}

test('real helper pairs, verifies HMAC, connects, receives a scan and posts its results', async t => {
 const {bridge, state, ctx, routes} = await fixture(t);
 assert.equal((await vm.runInContext(`connect({type:'pair',code:'${bridge.code}',tab:7})`, ctx)).ok, true);
 const result = await bridge.run('library', 'https://gumroad.com/library');
 assert.equal(result.pagination.count, 0);
 assert.equal(bridge.connected, true);
 assert.match(state.status, /^Connected/);
 assert.deepEqual(routes.slice(0, 4), ['/pair', '/hello', '/jobs', '/result']);
});

test('stale saved helper token expires plainly on both sides and can be paired again', async t => {
 const {bridge, state, ctx} = await fixture(t);
 bridge.auth = {origin: 'chrome-extension://' + 'a'.repeat(32), token: 'a'.repeat(64)};
 state.token = 'b'.repeat(64);
 const response = await vm.runInContext("connect({type:'reconnect',tab:7})", ctx);
 assert.equal(response.needsPair, true);
 assert.match(response.error, /Pairing expired/);
 assert.match(state.status, /Pairing expired/);
 assert.equal(state.token, undefined);
 assert.equal(bridge.info.pairingExpired, true);
 assert.equal(bridge.connected, false);
 assert.equal((await vm.runInContext(`connect({type:'pair',code:'${bridge.code}',tab:7})`, ctx)).ok, true);
 assert.equal(bridge.info.pairingExpired, false);
});

test('malformed saved pairing is recoverable instead of breaking token comparison', async t => {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gumshelf-invalid-pair-'));
 t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
 fs.writeFileSync(path.join(dir, 'browser-pair.json'), JSON.stringify({token: 'old'}));
 const bridge = new BrowserBridge(dir);
 assert.equal(bridge.info.paired, false);
 assert.equal(bridge.info.pairingExpired, true);
});

test('helper distinguishes a running unpaired app from an unavailable app', async t => {
 const {bridge, state, ctx} = await fixture(t);
 await vm.runInContext('connectionStatus()', ctx);
 assert.match(state.status, /^Not paired/);
 assert.equal(bridge.info.pairingExpired, false);
 await new Promise(resolve => bridge.server.close(resolve));
 await vm.runInContext('connectionStatus()', ctx);
 assert.match(state.status, /^App not running/);
});

test('polling delivers finish while a previous page command is still waiting', async t => {
 const {bridge, ctx} = await fixture(t);
 vm.runInContext("execute=job=>job.kind==='finish'?Promise.resolve({ok:true}):new Promise(()=>{})", ctx);
 await vm.runInContext(`connect({type:'pair',code:'${bridge.code}',tab:7})`, ctx);
 const detail = bridge.run('details', 'https://fictional.gumroad.com/l/product');
 const rejected = assert.rejects(detail, /SCAN_CANCELLED/);
 while (!Array.from(bridge.inflight.values()).some(task => task.delivered)) await new Promise(resolve => setTimeout(resolve, 5));
 bridge.cancelPending();
 assert.equal((await bridge.run('finish', 'https://gumroad.com/library')).ok, true);
 await rejected;
});
