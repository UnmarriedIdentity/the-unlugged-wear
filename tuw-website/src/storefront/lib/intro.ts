// The brand intro plays once per browser session. The key is shared by the
// intro (client) and the root layout's pre-paint script (server).
export const INTRO_SEEN_KEY = 'tuw_intro_seen';

/** Runs while the HTML is parsed, before first paint: hides the overlay for visitors who already saw it. */
export const INTRO_SEEN_SCRIPT = `try{if(sessionStorage.getItem('${INTRO_SEEN_KEY}')==='1')document.documentElement.setAttribute('data-intro-seen','')}catch(e){}`;
