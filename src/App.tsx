import { useEffect, useMemo, useState } from "react";
import { LABELS, MENU, SEAT_IDS } from "./constants";
import {
  addLine,
  checkout,
  emptyState,
  loadState,
  markServed,
  openSeats,
  queuedLines,
  saveState,
  sendDrafts,
  sessionForSeat,
} from "./store";
import type { PosState, Session } from "./types";

type Tab = "floor" | "kitchen" | "closed";
type View =
  | { kind: "main" }
  | { kind: "order"; sessionId: string }
  | { kind: "pay"; sessionId: string };

function yen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export function App() {
  const [state, setState] = useState<PosState>(() => loadState());
  const [tab, setTab] = useState<Tab>("floor");
  const [view, setView] = useState<View>({ kind: "main" });
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const session = useMemo(() => {
    if (view.kind === "main") return undefined;
    return state.sessions.find((s) => s.id === view.sessionId);
  }, [state.sessions, view]);

  const kitchen = queuedLines(state);

  function patch(next: PosState) {
    setState(next);
  }

  function onSeatClick(seatId: string) {
    const existing = sessionForSeat(state, seatId);
    if (existing) {
      setSelected([]);
      setView({ kind: "order", sessionId: existing.id });
      return;
    }
    setSelected((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId],
    );
  }

  function doOpen() {
    if (selected.length === 0) return;
    const next = openSeats(state, selected);
    const created = next.sessions.find(
      (s) => !state.sessions.some((old) => old.id === s.id),
    );
    patch(next);
    setSelected([]);
    if (created) setView({ kind: "order", sessionId: created.id });
  }

  function renderOrder(s: Session) {
    const drafts = s.lines.filter((l) => l.status === "draft");
    const canPay =
      s.lines.length > 0 &&
      s.lines.every((l) => l.status === "served");

    return (
      <div className="panel">
        <h2>
          {LABELS.order.title} — {s.seatIds.join("・")}
        </h2>
        <div className="menu-grid">
          {MENU.map((m) => (
            <div key={m.id} className="menu-row">
              <span>
                {m.name}{" "}
                <span className="muted">{yen(m.price)}</span>
              </span>
              <button type="button" onClick={() => patch(addLine(state, s.id, m.id))}>
                {LABELS.order.add}
              </button>
            </div>
          ))}
        </div>
        <ul className="lines">
          {s.lines.map((l) => (
            <li key={l.id}>
              <span>{l.name}</span>
              <span>
                <span className="badge">{l.status}</span> {yen(l.price)}
              </span>
            </li>
          ))}
        </ul>
        <div className="actions">
          <button
            type="button"
            disabled={drafts.length === 0}
            onClick={() => patch(sendDrafts(state, s.id))}
          >
            {LABELS.order.send}
          </button>
          <button
            type="button"
            className="warn"
            disabled={!canPay}
            onClick={() => setView({ kind: "pay", sessionId: s.id })}
          >
            {LABELS.seat.pay}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => setView({ kind: "main" })}
          >
            {LABELS.order.back}
          </button>
        </div>
      </div>
    );
  }

  function renderPay(s: Session) {
    const total = s.lines.reduce((sum, l) => sum + l.price, 0);
    const blocked = s.lines.some((l) => l.status !== "served");
    return (
      <div className="panel">
        <h2>
          {LABELS.checkout.title} — {s.seatIds.join("・")}
        </h2>
        <ul className="lines">
          {s.lines.map((l) => (
            <li key={l.id}>
              <span>{l.name}</span>
              <span>{yen(l.price)}</span>
            </li>
          ))}
        </ul>
        <p className="total">
          {LABELS.checkout.total}: {yen(total)}
        </p>
        {blocked && (
          <p className="muted">未提供の明細があります。提供タブで完了させてください。</p>
        )}
        <div className="actions">
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              patch(checkout(state, s.id));
              setView({ kind: "main" });
              setTab("closed");
            }}
          >
            {LABELS.checkout.confirm}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => setView({ kind: "order", sessionId: s.id })}
          >
            {LABELS.checkout.cancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>{LABELS.brand}</h1>
        <p>{LABELS.subtitle}</p>
        <div className="header-actions">
          <a href="/manual.html">
            <button type="button" className="ghost">
              {LABELS.manual}
            </button>
          </a>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              patch(emptyState());
              setView({ kind: "main" });
              setSelected([]);
              setTab("floor");
            }}
          >
            {LABELS.reset}
          </button>
        </div>
      </header>

      {view.kind === "order" && session && renderOrder(session)}
      {view.kind === "pay" && session && renderPay(session)}

      {view.kind === "main" && (
        <>
          <nav className="tabs">
            {(
              [
                ["floor", LABELS.tabs.floor],
                ["kitchen", LABELS.tabs.kitchen],
                ["closed", LABELS.tabs.closed],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={tab === id ? "active" : undefined}
                onClick={() => setTab(id)}
              >
                {label}
                {id === "kitchen" && kitchen.length > 0 ? ` (${kitchen.length})` : ""}
              </button>
            ))}
          </nav>

          {tab === "floor" && (
            <>
              <div className="floor">
                {SEAT_IDS.map((id) => {
                  const sess = sessionForSeat(state, id);
                  const isSel = selected.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`seat ${sess ? "busy" : "vacant"}`}
                      style={isSel ? { outline: "2px solid var(--accent)" } : undefined}
                      onClick={() => onSeatClick(id)}
                    >
                      <span className="id">{id}</span>
                      <span className="status">
                        {sess ? "接客中" : isSel ? "選択中" : LABELS.seat.vacant}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="actions">
                <button type="button" disabled={selected.length === 0} onClick={doOpen}>
                  {LABELS.seat.open}
                  {selected.length > 0 ? `（${selected.join("・")}）` : ""}
                </button>
              </div>
            </>
          )}

          {tab === "kitchen" && (
            <div className="panel">
              <h2>{LABELS.tabs.kitchen}</h2>
              {kitchen.length === 0 ? (
                <p className="muted">{LABELS.kitchen.empty}</p>
              ) : (
                kitchen.map(({ line, seats }) => (
                  <div key={line.id} className="kitchen-item">
                    <div>
                      <strong>{line.name}</strong>
                      <div className="muted">席 {seats.join("・")}</div>
                    </div>
                    <button type="button" onClick={() => patch(markServed(state, line.id))}>
                      {LABELS.kitchen.markDone}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "closed" && (
            <div className="panel">
              <h2>{LABELS.tabs.closed}</h2>
              {state.closed.length === 0 ? (
                <p className="muted">まだ会計はありません</p>
              ) : (
                <ul className="closed-list">
                  {state.closed.map((c) => (
                    <li key={c.id}>
                      <span>
                        {c.seatIds.join("・")} · {c.lineCount}品 ·{" "}
                        {new Date(c.closedAt).toLocaleTimeString("ja-JP")}
                      </span>
                      <strong>{yen(c.total)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
