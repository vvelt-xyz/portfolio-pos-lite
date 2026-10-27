export const LABELS = {
  brand: "POS Lite",
  subtitle: "ポートフォリオ用デモ（本番店舗システムではありません）",
  tabs: {
    floor: "フロア",
    kitchen: "提供",
    closed: "会計済",
  },
  seat: {
    vacant: "空席",
    open: "案内",
    order: "注文",
    pay: "会計",
  },
  kitchen: {
    empty: "提供待ちはありません",
    markDone: "提供済み",
  },
  checkout: {
    title: "会計",
    total: "合計（税込）",
    confirm: "会計する",
    cancel: "戻る",
  },
  order: {
    title: "注文",
    add: "追加",
    send: "キッチンへ送る",
    back: "フロアへ",
  },
  reset: "デモを初期化",
  manual: "操作マニュアル",
} as const;

export const MENU = [
  { id: "ramen", name: "醤油ラーメン", price: 980 },
  { id: "miso", name: "味噌ラーメン", price: 1050 },
  { id: "gyoza", name: "餃子（6個）", price: 450 },
  { id: "beer", name: "生ビール", price: 550 },
  { id: "ocha", name: "お茶", price: 0 },
] as const;

export const SEAT_IDS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2"] as const;

export const STORAGE_KEY = "portfolio-pos-lite-v1";
