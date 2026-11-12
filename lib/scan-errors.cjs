const recoveryRules=[
 ['library-tab',/choose your signed.in gumroad library tab|no (?:signed.in )?library tab|no tab with id|invalid tab id/i,'Open your signed-in Gumroad Library in the same browser profile. In GumShelf Browser Helper, choose that tab and click Connect selected Library. Then continue this scan.'],
 ['helper-update',/reload gumshelf browser helper|unsupported library format|product details could not be read/i,'Reload GumShelf Browser Helper in your browser Extensions page. Open the helper, choose your Library tab, then continue this scan.'],
 ['sign-in',/finish signing in|not a signed.in gumroad|confirm you are signed in/i,'Sign in normally on your Gumroad Library tab. Select it in the helper, then continue this scan.'],
 ['connection',/browser disconnected|browser did not respond|open the browser helper|connect your browser helper|pair (?:this|your) browser|open the gumshelf desktop/i,'Open GumShelf Browser Helper, choose your signed-in Library tab and click Connect selected Library. Then continue this scan.'],
 ['slow-down',/too many requests|rate.limit|asking us to slow down|temporarily blocked/i,'Gumroad is asking us to slow down. Leave this scan stopped and try again later. Existing products are kept.']
];
function recoveryFor(error){const message=String(error?.message||error||'');const rule=recoveryRules.find(([,pattern])=>pattern.test(message));return rule?{code:rule[0],message:rule[2]}:null;}
module.exports={recoveryFor};
