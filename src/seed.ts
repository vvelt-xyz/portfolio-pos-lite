import type { MenuItem, PosSettings, PosState, Seat } from "./domain";
import { todayStamp } from "./domain";

/** Fictional WELT demo shop — not a real client. */
export const DEMO_SETTINGS: PosSettings = {
  storeName: "WELT Demo Kitchen",
  standardRate: 0.1,
  reducedRate: 0.08,
  rounding: "floor",
  pricesAreTaxIncluded: true,
};

export const DEMO_MENU: MenuItem[] = [
  {
    id: "ramen-shoyu",
    name: "醤油ラーメン",
    price: 980,
    taxType: "reduced",
    category: "麺",
  },
  {
    id: "ramen-miso",
    name: "味噌ラーメン",
    price: 1050,
    taxType: "reduced",
    category: "麺",
  },
  {
    id: "gyoza",
    name: "餃子（6個）",
    price: 450,
    taxType: "reduced",
    category: "サイド",
  },
  {
    id: "beer",
    name: "生ビール",
    price: 550,
    taxType: "standard",
    category: "ドリンク",
  },
  {
    id: "ocha",
    name: "お茶",
    price: 0,
    taxType: "standard",
    category: "ドリンク",
  },
  {
    id: "dessert",
    name: "杏仁豆腐",
    price: 380,
    taxType: "reduced",
    category: "デザート",
  },
];

/** Simple grid layout (Inspect shows this structure). */
export const DEMO_SEATS: Seat[] = [
  { id: "t1", label: "1", kind: "table", capacity: 4, col: 1, row: 1 },
  { id: "t2", label: "2", kind: "table", capacity: 4, col: 2, row: 1 },
  { id: "t3", label: "3", kind: "table", capacity: 2, col: 3, row: 1 },
  { id: "t4", label: "4", kind: "table", capacity: 4, col: 1, row: 2 },
  { id: "t5", label: "5", kind: "table", capacity: 4, col: 2, row: 2 },
  { id: "t6", label: "6", kind: "table", capacity: 2, col: 3, row: 2 },
  { id: "b1", label: "B1", kind: "bar", capacity: 1, col: 4, row: 1 },
  { id: "b2", label: "B2", kind: "bar", capacity: 1, col: 4, row: 2 },
  { id: "b3", label: "B3", kind: "bar", capacity: 1, col: 4, row: 3 },
];

export function createSeedState(): PosState {
  return {
    settings: { ...DEMO_SETTINGS },
    menu: DEMO_MENU.map((m) => ({ ...m })),
    seats: DEMO_SEATS.map((s) => ({ ...s })),
    sessions: [],
    closed: [],
    daySeq: 0,
    businessDate: todayStamp(),
  };
}
