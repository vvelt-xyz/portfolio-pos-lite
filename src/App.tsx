import { useEffect, useMemo, useState } from "react";
import {
  type PayMethod,
  type Session,
  guestTotal,
  hasUnserved,
  seatLabel,
  sessionTotal,
  yen,
} from "./domain";
import { L } from "./labels";
import {
  addLine,
  cancelLine,
  changeQty,
  checkout,
  loadState,
  openTable,
  openTakeout,
  queuedKitchen,
  resetState,
  saveState,
  sendDrafts,
  sessionForSeat,
  markServed,
  todaySales,
} from "./store";
import type { PosState } from "./domain";

type Tab = "floor" | "kitchen" | "sales" | "settings";
type View =
  | { kind: "main" }
  | { kind: "order"; sessionId: string }
  | { kind: "pay"; sessionId: string };

const PAY_LABEL: Record<PayMethod, string> = {
  cash: "現金",
  card: "カード",
  emoney: "電子",
};

export function App() {
  const [state, setState] = useState<PosState>(() => loadState());
  const [tab, setTab] = useState<Tab>("floor");
  const [view, setView] = useState<View>({ kind: "main" });
  const [selected, setSelected] = useState<string[]>([]);
  const [guests, setGuests] = useState({ male: 1, female: 0, child: 0 });
  const [memo, setMemo] = useState("");
  const [allowUnserved, setAllowUnserved] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");

  useEffect(() => {
    saveState(state);
  }, [state]);

  const session = useMemo(() => {
    if (view.kind === "main") return undefined;
    return state.sessions.find((s) => s.id === view.sessionId);
  }, [state.sessions, view]);

  const kitchen = queuedKitchen(state);
  const sales = todaySales(state);

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
    const next = openTable(state, selected, guests, memo);
    const created = next.sessions.find(
      (s) => !state.sessions.some((o) => o.id === s.id),
    );
    patch(next);
    setSelected([]);
    setMemo("");
    if (created) setView({ kind: "order", sessionId: created.id });
  }

  function doTakeout() {
    const next = openTakeout(state, guests, memo);
    const created = next.sessions.find(
      (s) => !state.sessions.some((o) => o.id === s.id),
    );
    patch(next);
    setMemo("");
    if (created) setView({ kind: "order", sessionId: created.id });
  }

  function renderOrder(s: Session) {
    const drafts = s.lines.filter((l) => l.status === "draft");
    const canPay =
      s.lines.some((l) => l.status !== "cancelled") &&
      !s.lines.some((l) => l.status === "draft");

    return (
      <section className="panel">
        <header className="panel-head">
          <div>
            <h2>
              {L.order} · {seatLabel(state.seats, s.seatIds, s.takeout)}
            </h2>
            <p className="muted">
              #{s.displayId} · 人数 {guestTotal(s.guests)}
              {s.memo ? ` · ${s.memo}` : ""}
            </p>
          </div>
          <button type="button" className="ghost" onClick={() => setView({ kind: "main" })}>
            フロアへ
          </button>
        </header>

        <div className="menu-grid">
          {state.menu.map((m) => (
            <div key={m.id} className="menu-row">
              <div>
                <strong>{m.name}</strong>
                <span className="muted">
                  {" "}
                  {yen(m.price)} · {m.taxType === "reduced" ? "軽減" : "標準"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => patch(addLine(state, s.id, m.id, s.takeout))}
              >
                追加
              </button>
            </div>
          ))}
        </div>

        <ul className="lines">
          {s.lines.map((l) => (
            <li key={l.id} className={l.status === "cancelled" ? "cancelled" : undefined}>
              <span>
                {l.name} ×{l.qty}
                <span className="badge">{l.status}</span>
              </span>
              <span className="line-actions">
                {l.status === "draft" && (
                  <>
                    <button
                      type="button"
                      className="ghost tiny"
                      onClick={() => patch(changeQty(state, s.id, l.id, -1))}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className="ghost tiny"
                      onClick={() => patch(changeQty(state, s.id, l.id, 1))}
                    >
                      ＋
                    </button>
                  </>
                )}
                {(l.status === "draft" || l.status === "queued") && (
                  <button
                    type="button"
                    className="ghost tiny"
                    onClick={() => patch(cancelLine(state, s.id, l.id))}
                  >
                    取消
                  </button>
                )}
                <strong>{yen(l.unitPrice * l.qty)}</strong>
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
            {L.send}
          </button>
          <button
            type="button"
            className="warn"
            disabled={!canPay}
            onClick={() => {
              setAllowUnserved(false);
              setView({ kind: "pay", sessionId: s.id });
            }}
          >
            {L.pay}
          </button>
        </div>
      </section>
    );
  }

  function renderPay(s: Session) {
    const total = sessionTotal(s);
    const blocked = hasUnserved(s) && !allowUnserved;
    return (
      <section className="panel">
        <h2>
          {L.pay} · {seatLabel(state.seats, s.seatIds, s.takeout)}
        </h2>
        <p className="muted">#{s.displayId} · 税込表示（シード設定）</p>
        <ul className="lines">
          {s.lines
            .filter((l) => l.status !== "cancelled")
            .map((l) => (
              <li key={l.id}>
                <span>
                  {l.name} ×{l.qty}{" "}
                  <span className="badge">{l.status}</span>
                </span>
                <strong>{yen(l.unitPrice * l.qty)}</strong>
              </li>
            ))}
        </ul>
        <p className="total">合計 {yen(total)}</p>
        {hasUnserved(s) && (
          <label className="check">
            <input
              type="checkbox"
              checked={allowUnserved}
              onChange={(e) => setAllowUnserved(e.target.checked)}
            />
            未提供の明細があります。確認のうえ会計する
          </label>
        )}
        <div className="pay-methods">
          {(Object.keys(PAY_LABEL) as PayMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              className={payMethod === m ? undefined : "ghost"}
              onClick={() => setPayMethod(m)}
            >
              {PAY_LABEL[m]}
            </button>
          ))}
        </div>
        <div className="actions">
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              patch(checkout(state, s.id, payMethod, allowUnserved));
              setView({ kind: "main" });
              setTab("sales");
            }}
          >
            会計を確定
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => setView({ kind: "order", sessionId: s.id })}
          >
            戻る
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="app">
      <div className="banner">{L.demoBadge}</div>

      <header className="header">
        <div className="brand">
          <img src="/welt-logo.png" alt="WELT" className="logo" />
          <div>
            <h1>{L.brand}</h1>
            <p className="muted">{state.settings.storeName}</p>
          </div>
        </div>
        <div className="header-actions">
          <a className="ghost-link" href="/manual.html">
            {L.manual}
          </a>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              patch(resetState());
              setView({ kind: "main" });
              setSelected([]);
              setTab("floor");
            }}
          >
            {L.reset}
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
                ["floor", L.tabs.floor],
                ["kitchen", `${L.tabs.kitchen}${kitchen.length ? ` (${kitchen.length})` : ""}`],
                ["sales", L.tabs.sales],
                ["settings", L.tabs.settings],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={tab === id ? "active" : undefined}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === "floor" && (
            <>
              <div className="floor" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                {state.seats.map((seat) => {
                  const sess = sessionForSeat(state, seat.id);
                  const isSel = selected.includes(seat.id);
                  const queued = sess
                    ? sess.lines.filter((l) => l.status === "queued").length
                    : 0;
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      className={`seat ${sess ? "busy" : "vacant"} ${seat.kind}`}
                      style={{
                        gridColumn: seat.col,
                        gridRow: seat.row,
                        outline: isSel ? "2px solid var(--accent)" : undefined,
                      }}
                      onClick={() => onSeatClick(seat.id)}
                    >
                      <span className="id">{seat.label}</span>
                      <span className="status">
                        {sess ? `接客中${queued ? ` · 提供前${queued}` : ""}` : isSel ? "選択中" : "空席"}
                      </span>
                      <span className="cap">{seat.capacity}名</span>
                    </button>
                  );
                })}
              </div>

              <div className="open-bar panel">
                <div className="guest-row">
                  <label>
                    男
                    <input
                      type="number"
                      min={0}
                      value={guests.male}
                      onChange={(e) =>
                        setGuests((g) => ({ ...g, male: Number(e.target.value) || 0 }))
                      }
                    />
                  </label>
                  <label>
                    女
                    <input
                      type="number"
                      min={0}
                      value={guests.female}
                      onChange={(e) =>
                        setGuests((g) => ({
                          ...g,
                          female: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </label>
                  <label>
                    子
                    <input
                      type="number"
                      min={0}
                      value={guests.child}
                      onChange={(e) =>
                        setGuests((g) => ({
                          ...g,
                          child: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </label>
                  <label className="grow">
                    メモ
                    <input
                      type="text"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="任意"
                    />
                  </label>
                </div>
                <div className="actions">
                  <button type="button" disabled={selected.length === 0} onClick={doOpen}>
                    {L.open}
                    {selected.length > 0
                      ? `（${selected
                          .map((id) => state.seats.find((s) => s.id === id)?.label)
                          .join("・")}）`
                      : ""}
                  </button>
                  <button type="button" className="ghost" onClick={doTakeout}>
                    {L.takeout}
                  </button>
                </div>
                {state.sessions.filter((s) => s.takeout).length > 0 && (
                  <div className="takeout-list">
                    <p className="muted">接客中テイクアウト</p>
                    {state.sessions
                      .filter((s) => s.takeout)
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="ghost"
                          onClick={() => setView({ kind: "order", sessionId: s.id })}
                        >
                          #{s.displayId}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "kitchen" && (
            <section className="panel">
              <h2>{L.tabs.kitchen}</h2>
              {kitchen.length === 0 ? (
                <p className="muted">提供待ちはありません</p>
              ) : (
                kitchen.map(({ line, session: s }) => (
                  <div key={line.id} className="kitchen-item">
                    <div>
                      <strong>
                        {line.name} ×{line.qty}
                      </strong>
                      <div className="muted">
                        {seatLabel(state.seats, s.seatIds, s.takeout)}
                        {s.takeout ? " · TO" : ""} · #{s.displayId}
                      </div>
                    </div>
                    <button type="button" onClick={() => patch(markServed(state, line.id))}>
                      {L.served}
                    </button>
                  </div>
                ))
              )}
            </section>
          )}

          {tab === "sales" && (
            <section className="panel">
              <h2>{L.tabs.sales}</h2>
              <p className="total">
                {sales.count} 件 · {yen(sales.total)}
              </p>
              <ul className="closed-list">
                <li>
                  <span>現金</span>
                  <strong>{yen(sales.byMethod.cash)}</strong>
                </li>
                <li>
                  <span>カード</span>
                  <strong>{yen(sales.byMethod.card)}</strong>
                </li>
                <li>
                  <span>電子</span>
                  <strong>{yen(sales.byMethod.emoney)}</strong>
                </li>
              </ul>
              <h3 className="sub">会計履歴</h3>
              {state.closed.length === 0 ? (
                <p className="muted">まだありません</p>
              ) : (
                <ul className="closed-list">
                  {state.closed.map((c) => (
                    <li key={c.id}>
                      <span>
                        #{c.displayId} · {c.seatLabel} · {PAY_LABEL[c.method]} ·{" "}
                        {new Date(c.closedAt).toLocaleTimeString("ja-JP")}
                      </span>
                      <strong>{yen(c.total)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "settings" && (
            <section className="panel inspect">
              <h2>{L.tabs.settings}</h2>
              <p className="inspect-banner">{L.inspectNote}</p>

              <h3 className="sub">店舗・税</h3>
              <dl className="kv">
                <div>
                  <dt>店舗名</dt>
                  <dd>{state.settings.storeName}</dd>
                </div>
                <div>
                  <dt>標準税率</dt>
                  <dd>{(state.settings.standardRate * 100).toFixed(0)}%</dd>
                </div>
                <div>
                  <dt>軽減税率</dt>
                  <dd>{(state.settings.reducedRate * 100).toFixed(0)}%</dd>
                </div>
                <div>
                  <dt>端数</dt>
                  <dd>{state.settings.rounding}</dd>
                </div>
                <div>
                  <dt>価格表示</dt>
                  <dd>
                    {state.settings.pricesAreTaxIncluded ? "税込カタログ" : "税抜"}
                  </dd>
                </div>
              </dl>

              <h3 className="sub">メニューマスター</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>カテゴリ</th>
                    <th>商品</th>
                    <th>税込</th>
                    <th>税区分</th>
                  </tr>
                </thead>
                <tbody>
                  {state.menu.map((m) => (
                    <tr key={m.id}>
                      <td>{m.category}</td>
                      <td>{m.name}</td>
                      <td>{yen(m.price)}</td>
                      <td>{m.taxType === "reduced" ? "軽減" : "標準"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="sub">フロア配置（グリッド）</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>席</th>
                    <th>種別</th>
                    <th>定員</th>
                    <th>col</th>
                    <th>row</th>
                  </tr>
                </thead>
                <tbody>
                  {state.seats.map((s) => (
                    <tr key={s.id}>
                      <td>{s.label}</td>
                      <td>{s.kind}</td>
                      <td>{s.capacity}</td>
                      <td>{s.col}</td>
                      <td>{s.row}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="muted">
                本番では配置マスターを編集できる。本デモは構造の可視化のみ（Inspect）。
              </p>
            </section>
          )}
        </>
      )}

      <footer className="footer">
        <span>{L.copyright}</span>
        <a href="https://vvelt.xyz" rel="noreferrer" target="_blank">
          vvelt.xyz
        </a>
      </footer>
    </div>
  );
}
