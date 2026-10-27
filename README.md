# portfolio-pos-lite

小規模飲食向け **Web POS** のコア動線を示すポートフォリオ用デモ。

本番プロダクト（private）から切り出した **薄いリビルド** です。店舗・顧客データは含みません。

## Demo

- 動作 URL: （Cloudflare Pages 初回デプロイ後に記入）
- マニュアル: デモ内 `/manual.html` またはヘッダー「操作マニュアル」
- Auth: なし（評価者の個人情報は取得しない）
- データ: ブラウザの `localStorage` のみ

### デモ手順（最短）

1. フロアで空席を選ぶ →「案内」
2. メニューを追加 →「キッチンへ送る」
3. 「提供」タブで提供済み
4. 接客中席を開き「会計」

## スタック

- TypeScript / React 19 / Vite
- 状態: クライアント完結（サーバなし）

## ローカル起動

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## 本番との関係

| | |
|---|---|
| 切り出し元 | `05_POSsystem`（private） |
| このリポ | 公開ショーケース。概念と動線の証明 |
| 含まない | Firebase、店舗固有設定、印刷、本番ドメインモデル一式 |

説明文の正本: [`docs/pitch.md`](./docs/pitch.md)

## ハブ

目次: [vvelt-portfolio](https://github.com/vvelt-xyz/vvelt-portfolio)
