export type TaxType = "standard" | "reduced";
export type LineStatus = "draft" | "queued" | "served" | "cancelled";
export type PayMethod = "cash" | "card" | "emoney";
export type SeatKind = "table" | "bar";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  taxType: TaxType;
  category: string;
};

export type Seat = {
  id: string;
  label: string;
  kind: SeatKind;
  capacity: number;
  col: number;
  row: number;
};

export type PosSettings = {
  storeName: string;
  standardRate: number;
  reducedRate: number;
  rounding: "floor" | "round" | "ceil";
  pricesAreTaxIncluded: boolean;
};

export type OrderLine = {
  id: string;
  menuId: string;
  name: string;
  unitPrice: number;
  qty: number;
  taxType: TaxType;
  status: LineStatus;
  takeout: boolean;
};

export type Session = {
  id: string;
  displayId: string;
  seatIds: string[];
  takeout: boolean;
  guests: { male: number; female: number; child: number };
  memo: string;
  lines: OrderLine[];
  openedAt: string;
};

export type ClosedCheck = {
  id: string;
  displayId: string;
  seatLabel: string;
  total: number;
  method: PayMethod;
  closedAt: string;
  lineCount: number;
};

export type PosState = {
  settings: PosSettings;
  menu: MenuItem[];
  seats: Seat[];
  sessions: Session[];
  closed: ClosedCheck[];
  daySeq: number;
  businessDate: string;
};

export function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

export function guestTotal(g: Session["guests"]): number {
  return g.male + g.female + g.child;
}

export function lineSubtotal(line: OrderLine): number {
  if (line.status === "cancelled") return 0;
  return line.unitPrice * line.qty;
}

export function sessionTotal(session: Session): number {
  return session.lines.reduce((s, l) => s + lineSubtotal(l), 0);
}

export function activeLines(session: Session): OrderLine[] {
  return session.lines.filter((l) => l.status !== "cancelled");
}

export function hasUnserved(session: Session): boolean {
  return activeLines(session).some(
    (l) => l.status === "draft" || l.status === "queued",
  );
}

export function seatLabel(seats: Seat[], ids: string[], takeout: boolean): string {
  if (takeout) return "テイクアウト";
  return ids
    .map((id) => seats.find((s) => s.id === id)?.label ?? id)
    .join("・");
}

export function todayStamp(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
