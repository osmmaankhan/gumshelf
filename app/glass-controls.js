(function(){
 const root = document.querySelector('#app');
 if (!root) return;
 const controls = GumAppearance.glassControls;
 const inputId = control => 'glass-' + control.id;
 let sampleDrag = null;

 root.addEventListener('pointerdown', event => {
  const lens = event.target.closest('.glass-demo-lens');
  if (!lens || sampleDrag || !event.isPrimary || event.button !== 0 || document.body.dataset.material === 'solid') return;
  const box = lens.getBoundingClientRect();
  const frame = lens.parentElement.getBoundingClientRect();
  sampleDrag = {lens, id:event.pointerId, x:event.clientX - box.left, y:event.clientY - box.top,
   centerX:frame.left + (frame.width - box.width)/2, centerY:frame.top + (frame.height - box.height)/2,
   maxX:(frame.width - box.width)/2, maxY:(frame.height - box.height)/2};
  lens.setPointerCapture(event.pointerId);
 });
 root.addEventListener('pointermove', event => {
  if (!sampleDrag || event.pointerId !== sampleDrag.id) return;
  const {lens,x,y,centerX,centerY,maxX,maxY} = sampleDrag;
  const dx = Math.max(-maxX,Math.min(maxX,event.clientX - x - centerX));
  const dy = Math.max(-maxY,Math.min(maxY,event.clientY - y - centerY));
  lens.style.translate = dx + 'px ' + dy + 'px';
 });
 for (const type of ['pointerup','pointercancel','lostpointercapture']) {
  window.addEventListener(type,event => {
   if (event.pointerId === sampleDrag?.id) sampleDrag = null;
  });
 }

 function sync() {
  const surface = document.getElementById('window-surface');
  const help = document.getElementById('glass-tune-help');
  if (!surface || !help) return;
  const solid = document.body.dataset.material === 'solid';
  const refraction = document.body.dataset.refractionProof === 'passed';
  const message = solid ? 'Glass controls are paused while solid surfaces are active.'
   : surface.value === 'desktop' ? 'Try the effects in this sample. Windows controls the blur behind the desktop window.'
   : 'Bend, Dispersion, Frost and Rim apply live to buttons, search fields, menus and the sidebar lens. Press and hold a sidebar item to see the lens bend.';
  const helpText = message;
  if (help.textContent !== helpText) help.textContent = helpText;
  for (const control of controls) {
   const input = document.getElementById(inputId(control));
   input.disabled = solid;
   const output = document.getElementById(input.id + '-value');
   const text = input.value + (control.unit ? ' ' + control.unit : '');
   if (output.textContent !== text) output.textContent = text;
  }
 }

 function decorate() {
  if (sampleDrag && !sampleDrag.lens.isConnected) sampleDrag = null;
  const surface = document.getElementById('window-surface');
  if (!surface || document.getElementById('glass-tuning')) return;
  const area = document.createElement('fieldset');
  area.id = 'glass-tuning';
  area.className = 'glass-tuning';
  area.innerHTML = '<legend>Glass effects</legend><div class="glass-demo" aria-hidden="true"><div class="glass-demo-lens"></div></div>'
   + controls.map(control => {
    const id = inputId(control);
    const value = parseFloat(document.body.style.getPropertyValue(control.css));
    return '<label for="' + id + '">' + control.label + '<input type="range" id="' + id
     + '" min="' + control.min + '" max="' + control.max + '" step="' + control.step
     + '" value="' + (Number.isFinite(value) ? value : control.initial) + '" aria-describedby="glass-tune-help">'
     + '<output id="' + id + '-value" aria-hidden="true"></output></label>';
   }).join('') + '<p id="glass-tune-help" class="note"></p>';
  surface.closest('.field').after(area);
  sync();
 }

 root.addEventListener('input', event => {
  const control = controls.find(item => inputId(item) === event.target.id);
  if (!control || event.target.disabled) return;
  const value = event.target.valueAsNumber + control.unit;
  document.body.style.setProperty(control.css, value);
  if (control.id === 'frost' && document.getElementById('window-surface').value === 'lens') {
   document.body.style.setProperty('--glass-blur', value);
   document.body.style.setProperty('--glass-lens-blur', value);
  }
  document.dispatchEvent(new Event('gumshelf-appearance'));
  sync();
 });
 root.addEventListener('change', async event => {
  const control = controls.find(item => inputId(item) === event.target.id);
  if (!control || event.target.disabled) return;
  try {
   await window.GumUpdateAppearance({[control.key]:event.target.valueAsNumber});
  } catch (error) {
   window.GumApplyAppearance();
   event.target.value = parseFloat(document.body.style.getPropertyValue(control.css));
   window.GumRange?.paint(event.target);
   sync();
   window.toast?.(error.message);
  }
 });
 new MutationObserver(decorate).observe(root,{childList:true,subtree:true});
 window.GumGlassControls = {sync};
 decorate();
})();
