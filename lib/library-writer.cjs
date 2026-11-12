const fs = require('node:fs/promises');
const path = require('node:path');

// Serialize saves so a slow Windows rename cannot let an older snapshot win.
class LibraryWriter {
 constructor(file, getState, {delay = 300, backupEvery = 6 * 3600000, onError = () => {}} = {}) {
  Object.assign(this, {file, getState, delay, backupEvery, onError});
  this.dirty = false;
  this.backupAt = 0;
  this.error = null;
 }
 schedule() {
  this.dirty = true;
  if (!this.timer && !this.writing) {
   this.timer = setTimeout(() => {
    this.timer = null;
    this.flush().catch(error => { this.error = error; this.onError(error); });
   }, this.delay);
  }
 }
 async backup() {
  if (Date.now() - this.backupAt < this.backupEvery) return;
  const dir = path.dirname(this.file);
  const backups = path.join(dir, 'backups');
  try {
   await fs.copyFile(this.file, path.join(dir, 'library.backup.json'));
   await fs.mkdir(backups, {recursive: true});
   await fs.copyFile(this.file, path.join(backups, 'library-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json'));
   const old = (await fs.readdir(backups)).filter(name => /^library-.+\.json$/.test(name)).sort();
   for (const name of old.slice(0, Math.max(0, old.length - 10))) await fs.rm(path.join(backups, name));
  } catch (error) {
   if (error.code !== 'ENOENT') throw error;
  }
  this.backupAt = Date.now();
 }
 async rename(from) {
  for (let attempt = 0; ; attempt++) {
   try { await fs.rename(from, this.file); return; }
   catch (error) {
    if (attempt >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(error.code)) throw error;
    await new Promise(resolve => setTimeout(resolve, 60 * (attempt + 1)));
   }
  }
 }
 async flush() {
  clearTimeout(this.timer);
  this.timer = null;
  if (this.writing) {
   await this.writing;
   if (this.dirty) return this.flush();
   return;
  }
  if (!this.dirty) return;
  this.writing = this.writePending();
  try { await this.writing; }
  finally { this.writing = null; }
 }
 async writePending() {
  try {
   while (this.dirty) {
    this.dirty = false;
    const json = JSON.stringify(this.getState());
    const temporary = this.file + '.tmp';
    const handle = await fs.open(temporary, 'w');
    try { await handle.writeFile(json); await handle.sync(); }
    finally { await handle.close(); }
    await this.backup();
    await this.rename(temporary);
   }
   this.error = null;
  } catch (error) {
   this.dirty = true;
   this.error = error;
   throw error;
  }
 }
}

module.exports = {LibraryWriter};
