# portfolio-pos-lite

**証明一文:** 小規模飲食向け Web POS として、フロア起点の接客と設定の深さが伝わる業務アプリを、WELT ブランドの公開デモで示せる。

**帯:** B（現場コア）· **秘匿:** なし  
切り出し表: [`docs/carve-out.md`](./docs/carve-out.md)

© 株式会社WELT · [vvelt.xyz](https://vvelt.xyz)

## Demo

- 動作 URL: https://portfolio-pos-lite.pages.dev/
- マニュアル: `/manual.html`
- モード: **Operate**（フロア〜会計） / **Inspect**（設定タブ・保存不可）
- Auth: なし（個人情報は取らない）
- データ: ブラウザ `localStorage` ＋架空シード（`WELT Demo Kitchen`）

### Operate（最短）

1. 空席を選ぶ → 人数を入れて「案内する」（またはテイクアウト）  
2. メニュー追加 → 必要なら数量／取消 →「キッチンへ送る」  
3. 「提供」で提供済み  
4. 接客中席から「会計」→ 支払手段 → 確定  

### 設定で見える項目（Inspect・変更不可）

- 店舗名、標準／軽減税率、端数、税込カタログ  
- メニューマスター（カテゴリ・税区分）  
- フロア配置（席・種別・定員・グリッド座標）  

## スタック

TypeScript / React 19 / Vite。クライアント完結（帯 B。複数端末同期・Firebase は差分表どおり対象外／本番）。

```bash
npm install
npm run dev
npm run build
```

## 差分表（本番 `05_POSsystem` との関係）

| 本番にある | ショーケース |
|---|---|
| フロア／案内／注文／提供／会計 | 含む（Operate） |
| 人数・メモ・TO・取消・数量 | 含む |
| 支払手段・未提供確認・本日集計 | 含む |
| 税率・メニュー・フロア配置 UI | Inspect のみ |
| Firebase Auth / Firestore 同期 | 対象外（帯 C 候補。README に明記） |
| 日締め・赤伝 | 対象外（今回 carve-out 外。run-log 参照） |
| レシート HW | 対象外 |
| 顧客店舗ブランド | 除外（WELT に置換） |
| 本番データ・秘密 | 除外 |

## ドキュメント

| ファイル | 内容 |
|---|---|
| [`docs/pitch.md`](./docs/pitch.md) | 貼り付け用短文 |
| [`docs/carve-out.md`](./docs/carve-out.md) | 切り出し合意 |
| [`docs/capabilities.md`](./docs/capabilities.md) | TIPS |
| [`docs/data-model.md`](./docs/data-model.md) | 構造の証拠 |
| [`docs/rebuild-run-log.md`](./docs/rebuild-run-log.md) | 手順走行メモ |

ハブ: [vvelt-portfolio](https://github.com/vvelt-xyz/vvelt-portfolio)
