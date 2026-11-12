const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {BrowserBridge} = require('../lib/browser-bridge.cjs');
const {ConnectedScanner} = require('../lib/connected-scanner.cjs');
const {Scanner, chooseSample} = require('../lib/scanner.cjs');
const {LibraryWriter} = require('../lib/library-writer.cjs');

function library() {
 return {settings: {}, collections: [{id: 'personal', productIds: ['0']}], scan: {}, products:
  Array.from({length: 1750}, (_, index) => ({
   id: String(index), name: 'Fictional product ' + index, creator: 'Fictional creator',
   category: 'Your category', notes: 'Keep my notes', saved: true, hidden: index === 1749,
   summary: 'Keep my AI summary', analysisSource: 'AI review', description: 'x'.repeat(900),
   publicUrl: 'https://fictional.gumroad.com/l/product-' + index
  }))};
}
function fixture(t, options = {}) {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gumshelf-responsive-'));
 const bridge = new BrowserBridge(dir, () => {}, options);
 bridge.auth = {origin: 'chrome-extension://' + 'a'.repeat(32), token: 'a'.repeat(64)};
 bridge.lastSeen = Date.now();
 const state = library();
 const scanner = new ConnectedScanner({dir, getState: () => state, save() {}, emit() {}, notify() {}}, bridge);
 t.after(() => { bridge.close(); fs.rmSync(dir, {recursive: true, force: true}); });
 return {bridge, state, scanner, dir};
}

test('a stale-connected helper that never answers ends a 1750-product sample within 20 seconds', async t => {
 const {bridge, state, scanner} = fixture(t);
 const original = structuredClone({products: state.products, collections: state.collections});
 let ticks = 0;
 const timer = setInterval(() => ticks++, 50);
 t.after(() => clearInterval(timer));
 const started = Date.now();
 await scanner.start({mode: 'sample', ids: chooseSample(state.products)});
 assert.equal(bridge.responseTimeout, 18000);
 assert.ok(Date.now() - started < 20500);
 assert.ok(ticks > 10);
 assert.equal(state.scan.status, 'error');
 assert.equal(state.scan.message, "Browser helper isn't responding. Open it and reconnect.");
 assert.equal(scanner.running, false);
 assert.equal(scanner.finishing, false);
 assert.deepEqual({products: state.products, collections: state.collections}, original);
});

test('Stop immediately cancels queued and delivered helper commands and preserves personal data', async t => {
 const {bridge, state, scanner} = fixture(t, {finishTimeout: 10});
 const original = structuredClone(state.products);
 const scan = scanner.start({mode: 'retry'});
 await new Promise(resolve => setImmediate(resolve));
 const started = Date.now();
 scanner.cancel();
 await scan;
 assert.ok(Date.now() - started < 500);
 assert.equal(state.scan.status, 'cancelled');
 assert.equal(bridge.inflight.size, 0);
 assert.equal(bridge.pending.length, 0);
 assert.deepEqual(state.products, original);
});

test('a disconnected helper rejects immediately before starting a scan', async t => {
 const {bridge, state, scanner} = fixture(t);
 bridge.lastSeen = 0;
 await assert.rejects(scanner.start({mode: 'sample'}), /Browser helper isn't responding/);
 assert.equal(scanner.running, false);
 assert.deepEqual(state.scan, {});
});

test('fast synthetic enrichment yields to the event loop and bounds progress and save calls', async () => {
 const state = library();
 let saves = 0, emits = 0, ticks = 0;
 const scanner = new Scanner({getState: () => state, save: () => saves++, emit: () => emits++, notify() {}});
 scanner.context = {newPage: async () => ({isClosed: () => false, close: async () => {}})};
 scanner.details = async () => ({detailState: 'limited'});
 const timer = setInterval(() => ticks++, 1);
 try { await scanner.start({mode: 'retry'}); }
 finally { clearInterval(timer); }
 assert.ok(ticks > 0);
 assert.ok(emits < 30);
 assert.ok(saves < 20);
 assert.equal(state.products[0].notes, 'Keep my notes');
 assert.equal(state.products[0].summary, 'Keep my AI summary');
 assert.equal(state.products[1749].hidden, true);
});

test('debounced asynchronous saves coalesce progress and flush the latest full library', async t => {
 const {state, dir} = fixture(t);
 const file = path.join(dir, 'library.json');
 let snapshots = 0;
 const writer = new LibraryWriter(file, () => { snapshots++; return state; });
 for (let i = 0; i < 1000; i++) writer.schedule();
 assert.equal(snapshots, 0);
 state.products[0].notes = 'Latest note';
 await writer.flush();
 assert.equal(snapshots, 1);
 assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), state);
});

test('edits arriving during a save are serialized after it and atomic failure preserves the old file', async t => {
 const {state, dir} = fixture(t);
 const file = path.join(dir, 'library.json');
 fs.writeFileSync(file, JSON.stringify(state));
 const writer = new LibraryWriter(file, () => state);
 let release;
 writer.backup = () => new Promise(resolve => { release = resolve; });
 writer.schedule();
 const first = writer.flush();
 while (!release) await new Promise(resolve => setImmediate(resolve));
 state.products[0].notes = 'Edited during save';
 writer.schedule();
 writer.backup = async () => {};
 release();
 await Promise.all([first, writer.flush()]);
 assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).products[0].notes, 'Edited during save');
 const previous = fs.readFileSync(file, 'utf8');
 const rename = writer.rename.bind(writer);
 writer.rename = async () => { throw Error('Fictional disk failure'); };
 state.products[0].notes = 'Retain this for retry';
 writer.schedule();
 await assert.rejects(writer.flush(), /Fictional disk failure/);
 assert.equal(fs.readFileSync(file, 'utf8'), previous);
 writer.rename = rename;
 await writer.flush();
 assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).products[0].notes, 'Retain this for retry');
});

test('renderer progress updates the scan controls without rebuilding the page', () => {
 const nodes = {};
 const node = selector => nodes[selector] ??= {textContent: '', style: {}, setAttribute(key, value) { this[key] = value; }, querySelector: node};
 const metrics = Array.from({length: 6}, () => ({textContent: ''}));
 node('.scan-hero').querySelectorAll = () => metrics;
 const ctx = vm.createContext({
  window: {matchMedia: () => ({addEventListener() {}})},
  document: {addEventListener() {}, querySelector: node, getElementById: node},
  setTimeout, clearTimeout, setInterval() {}, products: library().products
 });
 const source = fs.readFileSync(require.resolve('../app/app.js'), 'utf8');
 vm.runInContext(source.slice(0, source.lastIndexOf('(async()=>')), ctx);
 vm.runInContext("view='scan';state.products=products;render=()=>{throw Error('Full render during progress');};updateScanProgress({message:'Checking',processed:6,targetCount:12,quality:{descriptions:6,previews:5,missing:1},errors:[]})", ctx);
 assert.equal(node('[role="status"]').textContent, 'Checking');
 assert.equal(metrics[0].textContent, 1750);
 assert.equal(metrics[1].textContent, 6);
 assert.equal(node('i').style.width, '50%');
});

test('main progress sends compact scan events and keeps terminal and pause state snapshots', () => {
 const source = fs.readFileSync(require.resolve('../main.cjs'), 'utf8');
 const progress = source.slice(source.indexOf("let lastScanProgress="), source.indexOf('function send(){'));
 let snapshots = 0;
 const events = [];
 const state = {products: [], scan: {id: 'fake', status: 'running', phase: 'details'}};
 const ctx = vm.createContext({state, send: () => snapshots++, win: {isDestroyed: () => false, webContents: {send: (...args) => events.push(args)}}});
 vm.runInContext(progress, ctx);
 vm.runInContext("sendScanProgress();state.scan.processed=1;sendScanProgress();state.scan.status='paused';sendScanProgress();state.scan.status='complete';sendScanProgress()", ctx);
 assert.equal(snapshots, 3);
 assert.equal(events.length, 1);
 assert.equal(events[0][0], 'scan-progress');
});

test('a delivered job on a slow page survives past the pickup timeout while the helper keeps polling', async t => {
 const {bridge} = fixture(t, {responseTimeout: 40, jobTimeout: 5000});
 const job = bridge.run('details', 'https://fictional.gumroad.com/l/slow');
 const [queued] = bridge.pending.splice(0, 1);
 bridge.inflight.get(queued.id).delivered = true;
 const keepAlive = setInterval(() => { bridge.lastSeen = Date.now(); }, 10);
 t.after(() => clearInterval(keepAlive));
 await new Promise(resolve => setTimeout(resolve, 200));
 assert.ok(bridge.inflight.has(queued.id));
 bridge.inflight.get(queued.id).resolve({ok: true});
 assert.deepEqual(await job, {ok: true});
});

test('a delivered job fails once the helper stops polling', async t => {
 const {bridge} = fixture(t, {responseTimeout: 40, jobTimeout: 5000});
 const job = bridge.run('details', 'https://fictional.gumroad.com/l/slow');
 const [queued] = bridge.pending.splice(0, 1);
 bridge.inflight.get(queued.id).delivered = true;
 bridge.lastSeen = 0;
 await assert.rejects(job, /Browser helper isn't responding/);
});
