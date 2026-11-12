function linkFor(key, links) {
 if (key !== 'support' && key !== 'repo') throw Error('Invalid link key.');
 const value = links[key];
 if (value === '') return '';
 let url;
 try { url = new URL(value); }
 catch { throw Error('Invalid link.'); }
 const host = url.hostname;
 const allowed = ['ko-fi.com', 'buymeacoffee.com', 'gumroad.com', 'github.com'].includes(host) || host.endsWith('.gumroad.com');
 if (url.protocol !== 'https:' || !allowed || url.username || url.password) throw Error('Invalid link.');
 return url.href;
}

module.exports = {linkFor};
