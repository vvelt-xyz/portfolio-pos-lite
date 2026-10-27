# rebuild-run-log — 2026-10-27

手順: 母艦 `portfolio-rebuild.md` §10 ＋ skill `portfolio-showcase`

## 実施

1. carve-out 確定済み（帯B・秘匿なし・Inspect）を前提に同一リポを**継ぎ足しせず**ソース置換  
2. 本番 MVP（`01-mvp-scope.md`）と carve-out「含める」を突合  
3. Operate / Inspect / WELT ロゴ・コピーライト / リセット / ドキュメント一式  
4. Pages 再デプロイ・ハブ・母艦地図更新（この走行の後半）

## 手順から見えた抜け・摩擦

| 項目 | 内容 | 扱い |
|---|---|---|
| 日締め・赤伝 | 本番 MVP にあるが carve-out「含める」に無かった | 意図的対象外として差分表へ。規約に「MVP突合」チェックを追加済み |
| レイアウト「編集UI」 | Inspect は表表示。ドラッグ編集までは未 | capabilities で本番のみ／今後。アピールは構造可視化まで |
| 帯 C（Firebase） | 同期は出していない | 差分表で明示。厚みは UI／機微優先 |
| 旧デモデータ | storage key を v2 に変更 | 旧スケッチ状態と混在しない |
| 規約の節番号 | §参照ずれがあった | 母艦で修正済み |
| スキル不在 | 手順が docs のみで起動しづらい | `portfolio-showcase` を追加 |

## cold open（自己確認）

- [x] 案内→注文→提供→会計がマニュアルなしで通る想定  
- [x] 設定タブに Inspect バナー  
- [x] フッターに株式会社WELT  
- [x] ロゴ表示  

（デプロイ後に URL で再確認）
