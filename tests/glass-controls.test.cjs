const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Appearance = require('../app/appearance.js');

function fixture() {
 const controls = Appearance.glassControls;
 const listeners = new Map(), elements = new Map(), styles = new Map();
 const saved = Object.fromEntries(controls.map(control => [control.key, control.min]));
 const patches = [], notices = [], painted = [];
 let fail = false;
 const root = {addEventListener(type, fn) {listeners.set(type, fn);}};
 const body = {dataset: {material: 'blur'}, style: {
  getPropertyValue: key => styles.get(key) || '',
  setProperty: (key, value) => styles.set(key, String(value))
 }};
 const surface = {value: 'desktop', closest: () => ({after: area => elements.set(area.id, area)})};
 elements.set('window-surface', surface);
 elements.set('glass-tune-help', {textContent: ''});
 for (const control of controls) {
  let value = String(control.min);
  const id = 'glass-' + control.id;
  elements.set(id, {id, disabled: false,
   get value() {return value;}, set value(next) {value = String(next);},
   get valueAsNumber() {return Number(value);}
  });
  elements.set(id + '-value', {textContent: ''});
 }
 const apply = () => {
  for (const control of controls) body.style.setProperty(control.css, saved[control.key] + control.unit);
 };
 apply();
 const window = {
  addEventListener() {},
  GumApplyAppearance: apply,
  async GumUpdateAppearance(patch) {
   patches.push({...patch});
   if (fail) throw Error('Save failed');
   Object.assign(saved, patch);
   apply();
  },
  GumRange: {paint: input => painted.push(input.id)},
  toast: text => notices.push(text)
 };
 const context = vm.createContext({GumAppearance: Appearance, window,
  esc: value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character])),
  document: {body, querySelector: () => root, getElementById: id => elements.get(id), createElement: () => ({}), dispatchEvent() {}},
  Event: class {}, MutationObserver: class {observe() {}}
 });
 vm.runInContext(fs.readFileSync(require.resolve('../app/glass-controls.js'), 'utf8'), context);
 return {controls, elements, styles, body, surface, saved, patches, notices, painted, window, listeners,
  rejectSaves() {fail = true;}
 };
}

test('each glass slider has its exact explanation, affected surfaces and accessible help', () => {
 const f = fixture(), html = f.elements.get('glass-tuning').innerHTML;
 const help = [
  'How strongly glass lenses bend what is behind them.',
  'The rainbow split at the edge of a lens.',
  'How much glass blurs what is behind it.',
  'The light catching the edge of glass.'
 ];
 f.controls.forEach((control, index) => {
  assert.equal(control.help, help[index]);
  assert.ok(html.includes('aria-describedby="glass-' + control.id + '-help glass-tune-help"'));
  assert.ok(html.includes(help[index]));
 });
 assert.equal((html.match(/class="glass-control-help"/g) || []).length, 4);
 assert.equal((html.match(/Affects: sidebar selection \(while pressed\) · slider thumb \(while held\) · Find\/Plan and Brightness switches · the sample above/g) || []).length, 2);
 assert.equal((html.match(/Affects: buttons · search fields · menus and dropdowns · sidebar · top bar · main panel · footer/g) || []).length, 2);
 assert.match(html, /data-action="glass-reset">Reset glass/);
});

test('glass summary follows Desktop, In-app lens and Solid modes', () => {
 const f = fixture(), help = f.elements.get('glass-tune-help');
 assert.equal(help.textContent, "Windows blurs your wallpaper behind the window. These controls shape GumShelf's own glass.");
 f.surface.value = 'lens';
 f.window.GumGlassControls.sync();
 assert.equal(help.textContent, "These controls shape all of GumShelf's glass.");
 f.body.dataset.material = 'solid';
 f.window.GumGlassControls.sync();
 assert.equal(help.textContent, 'Glass controls are paused while solid surfaces are active.');
 assert.ok(f.controls.every(control => f.elements.get('glass-' + control.id).disabled));
});

test('reset saves every initial value and synchronizes slider thumbs and outputs', async () => {
 const f = fixture(), button = {disabled: false};
 await f.listeners.get('click')({target: {closest: () => button}});
 const expected = Object.fromEntries(f.controls.map(control => [control.key, control.initial]));
 assert.deepEqual(f.patches, [expected]);
 assert.deepEqual(f.saved, expected);
 assert.equal(button.disabled, false);
 for (const control of f.controls) {
  const id = 'glass-' + control.id;
  assert.equal(f.elements.get(id).valueAsNumber, control.initial);
  assert.equal(f.elements.get(id + '-value').textContent, control.initial + (control.unit ? ' ' + control.unit : ''));
  assert.ok(f.painted.includes(id));
 }
});

test('slider input still previews live, change saves, and failed reset restores saved values', async () => {
 const f = fixture(), input = f.elements.get('glass-frost');
 f.surface.value = 'lens';
 input.value = 7;
 f.listeners.get('input')({target: input});
 assert.equal(f.styles.get('--glass-frost'), '7px');
 assert.equal(f.styles.get('--glass-blur'), '7px');
 assert.equal(f.styles.get('--glass-lens-blur'), '7px');
 await f.listeners.get('change')({target: input});
 assert.deepEqual(f.patches[0], {glassFrost: 7});
 f.rejectSaves();
 input.value = 9;
 f.listeners.get('input')({target: input});
 const button = {disabled: false};
 await f.listeners.get('click')({target: {closest: () => button}});
 assert.equal(input.valueAsNumber, 7);
 assert.equal(button.disabled, false);
 assert.deepEqual(f.notices, ['Save failed']);
});
