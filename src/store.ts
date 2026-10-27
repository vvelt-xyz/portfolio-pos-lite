import {
  type ClosedCheck,
  type OrderLine,
  type PayMethod,
  type PosState,
  type Session,
  activeLines,
  hasUnserved,
  seatLabel,
  sessionTotal,
  todayStamp,
  uid,
} from "./domain";
import { createSeedState } from "./seed";

export const STORAGE_KEY = "portfolio-pos-lite-v2";

export function loadState(): PosState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as PosState;
    if (!parsed.settings || !Array.isArray(parsed.sessions)) {
      return createSeedState();
    }
    if (parsed.businessDate !== todayStamp()) {
      return {
        ...createSeedState(),
        settings: parsed.settings,
        menu: parsed.menu,
        seats: parsed.seats,
      };
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

export function saveState(state: PosState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): PosState {
  const next = createSeedState();
  saveState(next);
  return next;
}

export function sessionForSeat(
  state: PosState,
  seatId: string,
): Session | undefined {
  return state.sessions.find(
    (s) => !s.takeout && s.seatIds.includes(seatId),
  );
}

function nextDisplayId(state: PosState): { displayId: string; daySeq: number } {
  const daySeq = state.daySeq + 1;
  const displayId = `${state.businessDate}${String(daySeq).padStart(3, "0")}`;
  return { displayId, daySeq };
}

export function openTable(
  state: PosState,
  seatIds: string[],
  guests: Session["guests"],
  memo: string,
): PosState {
  const free = seatIds.filter((id) => !sessionForSeat(state, id));
  if (free.length === 0) return state;
  const { displayId, daySeq } = nextDisplayId(state);
  const session: Session = {
    id: uid("sess"),
    displayId,
    seatIds: free,
    takeout: false,
    guests,
    memo,
    lines: [],
    openedAt: new Date().toISOString(),
  };
  return {
    ...state,
    daySeq,
    sessions: [...state.sessions, session],
  };
}

export function openTakeout(
  state: PosState,
  guests: Session["guests"],
  memo: string,
): PosState {
  const { displayId, daySeq } = nextDisplayId(state);
  const session: Session = {
    id: uid("sess"),
    displayId,
    seatIds: [],
    takeout: true,
    guests,
    memo,
    lines: [],
    openedAt: new Date().toISOString(),
  };
  return {
    ...state,
    daySeq,
    sessions: [...state.sessions, session],
  };
}

export function addLine(
  state: PosState,
  sessionId: string,
  menuId: string,
  takeoutLine: boolean,
): PosState {
  const item = state.menu.find((m) => m.id === menuId);
  if (!item) return state;
  const line: OrderLine = {
    id: uid("line"),
    menuId: item.id,
    name: item.name,
    unitPrice: item.price,
    qty: 1,
    taxType: item.taxType,
    status: "draft",
    takeout: takeoutLine,
  };
  return mapSession(state, sessionId, (s) => ({
    ...s,
    lines: [...s.lines, line],
  }));
}

export function changeQty(
  state: PosState,
  sessionId: string,
  lineId: string,
  delta: number,
): PosState {
  return mapSession(state, sessionId, (s) => ({
    ...s,
    lines: s.lines.map((l) => {
      if (l.id !== lineId || l.status !== "draft") return l;
      const qty = Math.max(1, l.qty + delta);
      return { ...l, qty };
    }),
  }));
}

export function cancelLine(
  state: PosState,
  sessionId: string,
  lineId: string,
): PosState {
  return mapSession(state, sessionId, (s) => ({
    ...s,
    lines: s.lines.map((l) =>
      l.id === lineId && (l.status === "draft" || l.status === "queued")
        ? { ...l, status: "cancelled" as const }
        : l,
    ),
  }));
}

export function sendDrafts(state: PosState, sessionId: string): PosState {
  return mapSession(state, sessionId, (s) => ({
    ...s,
    lines: s.lines.map((l) =>
      l.status === "draft" ? { ...l, status: "queued" as const } : l,
    ),
  }));
}

export function markServed(state: PosState, lineId: string): PosState {
  return {
    ...state,
    sessions: state.sessions.map((s) => ({
      ...s,
      lines: s.lines.map((l) =>
        l.id === lineId && l.status === "queued"
          ? { ...l, status: "served" as const }
          : l,
      ),
    })),
  };
}

export function checkout(
  state: PosState,
  sessionId: string,
  method: PayMethod,
  allowUnserved: boolean,
): PosState {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session) return state;
  if (hasUnserved(session) && !allowUnserved) return state;
  const total = sessionTotal(session);
  const check: ClosedCheck = {
    id: uid("chk"),
    displayId: session.displayId,
    seatLabel: seatLabel(state.seats, session.seatIds, session.takeout),
    total,
    method,
    closedAt: new Date().toISOString(),
    lineCount: activeLines(session).length,
  };
  return {
    ...state,
    sessions: state.sessions.filter((s) => s.id !== sessionId),
    closed: [check, ...state.closed].slice(0, 40),
  };
}

export function queuedKitchen(state: PosState): Array<{
  line: OrderLine;
  session: Session;
}> {
  const out: Array<{ line: OrderLine; session: Session }> = [];
  for (const session of state.sessions) {
    for (const line of session.lines) {
      if (line.status === "queued") out.push({ line, session });
    }
  }
  return out;
}

export function todaySales(state: PosState): {
  count: number;
  total: number;
  byMethod: Record<PayMethod, number>;
} {
  const byMethod: Record<PayMethod, number> = {
    cash: 0,
    card: 0,
    emoney: 0,
  };
  let total = 0;
  for (const c of state.closed) {
    total += c.total;
    byMethod[c.method] += c.total;
  }
  return { count: state.closed.length, total, byMethod };
}

function mapSession(
  state: PosState,
  sessionId: string,
  fn: (s: Session) => Session,
): PosState {
  return {
    ...state,
    sessions: state.sessions.map((s) => (s.id === sessionId ? fn(s) : s)),
  };
}
