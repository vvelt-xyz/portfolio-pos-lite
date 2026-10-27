import { MENU, STORAGE_KEY } from "./constants";
import type { ClosedCheck, OrderLine, PosState, Session } from "./types";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyState(): PosState {
  return { sessions: [], closed: [] };
}

export function loadState(): PosState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as PosState;
    if (!Array.isArray(parsed.sessions) || !Array.isArray(parsed.closed)) {
      return emptyState();
    }
    return parsed;
  } catch {
    return emptyState();
  }
}

export function saveState(state: PosState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function sessionForSeat(
  state: PosState,
  seatId: string,
): Session | undefined {
  return state.sessions.find((s) => s.seatIds.includes(seatId));
}

export function openSeats(state: PosState, seatIds: string[]): PosState {
  const free = seatIds.filter((id) => !sessionForSeat(state, id));
  if (free.length === 0) return state;
  const session: Session = {
    id: uid("sess"),
    seatIds: free,
    lines: [],
    openedAt: new Date().toISOString(),
  };
  return { ...state, sessions: [...state.sessions, session] };
}

export function addLine(state: PosState, sessionId: string, menuId: string): PosState {
  const item = MENU.find((m) => m.id === menuId);
  if (!item) return state;
  const line: OrderLine = {
    id: uid("line"),
    menuId: item.id,
    name: item.name,
    price: item.price,
    status: "draft",
  };
  return {
    ...state,
    sessions: state.sessions.map((s) =>
      s.id === sessionId ? { ...s, lines: [...s.lines, line] } : s,
    ),
  };
}

export function sendDrafts(state: PosState, sessionId: string): PosState {
  return {
    ...state,
    sessions: state.sessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            lines: s.lines.map((l) =>
              l.status === "draft" ? { ...l, status: "queued" } : l,
            ),
          }
        : s,
    ),
  };
}

export function markServed(state: PosState, lineId: string): PosState {
  return {
    ...state,
    sessions: state.sessions.map((s) => ({
      ...s,
      lines: s.lines.map((l) =>
        l.id === lineId && l.status === "queued"
          ? { ...l, status: "served" }
          : l,
      ),
    })),
  };
}

export function checkout(state: PosState, sessionId: string): PosState {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session) return state;
  if (session.lines.some((l) => l.status === "draft" || l.status === "queued")) {
    return state;
  }
  const total = session.lines.reduce((sum, l) => sum + l.price, 0);
  const check: ClosedCheck = {
    id: uid("chk"),
    seatIds: session.seatIds,
    total,
    closedAt: new Date().toISOString(),
    lineCount: session.lines.length,
  };
  return {
    sessions: state.sessions.filter((s) => s.id !== sessionId),
    closed: [check, ...state.closed].slice(0, 20),
  };
}

export function queuedLines(state: PosState): Array<{
  line: OrderLine;
  seats: string[];
  sessionId: string;
}> {
  const out: Array<{ line: OrderLine; seats: string[]; sessionId: string }> = [];
  for (const s of state.sessions) {
    for (const line of s.lines) {
      if (line.status === "queued") {
        out.push({ line, seats: s.seatIds, sessionId: s.id });
      }
    }
  }
  return out;
}
