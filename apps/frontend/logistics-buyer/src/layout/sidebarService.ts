// Port of SidebarService (spec 00 §13.7): pages can read whether the sidebar is open (e.g. to resize maps).
type L = (open: boolean) => void;
const listeners = new Set<L>();
let state = true;

export const sidebarService = {
  setSidebarState(open: boolean) {
    state = open;
    listeners.forEach((l) => l(open));
  },
  toggleSidebar() {
    this.setSidebarState(!state);
  },
  getSidebarState: () => state,
  subscribe(fn: L) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
