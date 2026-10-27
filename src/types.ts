export type LineStatus = "draft" | "queued" | "served";

export type OrderLine = {
  id: string;
  menuId: string;
  name: string;
  price: number;
  status: LineStatus;
};

export type Session = {
  id: string;
  seatIds: string[];
  lines: OrderLine[];
  openedAt: string;
};

export type ClosedCheck = {
  id: string;
  seatIds: string[];
  total: number;
  closedAt: string;
  lineCount: number;
};

export type PosState = {
  sessions: Session[];
  closed: ClosedCheck[];
};
