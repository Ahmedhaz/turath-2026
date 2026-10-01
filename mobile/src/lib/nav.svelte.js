// Navigation the way a native app does it: five tabs, each with its own stack, plus a full-screen
// reader and one modal sheet on top. Android's back button pops whatever is on top.
export const TABS = ['today', 'library', 'guide', 'search', 'saved'];

export const nav = $state({
  tab: 'today',
  stacks: { today: [], library: [], guide: [], search: [], saved: [] },
  reader: null,      // { b, n, at? }
  sheet: null,       // { kind, ...props }
  dir: 1,            // 1 push, -1 pop: drives the slide direction
});

export function go(screen, props = {}) {
  nav.dir = 1;
  nav.stacks[nav.tab] = [...nav.stacks[nav.tab], { screen, props, id: Math.random() }];
}

export function back() {
  if (nav.sheet) { nav.sheet = null; return true; }
  if (nav.reader) { nav.reader = null; return true; }
  const s = nav.stacks[nav.tab];
  if (s.length) { nav.dir = -1; nav.stacks[nav.tab] = s.slice(0, -1); return true; }
  if (nav.tab !== 'today') { nav.tab = 'today'; return true; }
  return false;
}

export function selectTab(t) {
  if (nav.tab === t) { nav.dir = -1; nav.stacks[t] = []; return; } // tapping the active tab returns to its root
  nav.tab = t;
}

export function read(b, n, at) { nav.reader = { b, n: +n, at }; }
export function sheet(kind, props = {}) { nav.sheet = { kind, ...props }; }
export function closeSheet() { nav.sheet = null; }
