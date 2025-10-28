---
marp: true
theme: default
paginate: true
header: 'Subagents を用いた体系的な機能開発'
footer: 'cc-subagents-sample'
---

# Subagents を用いた体系的な機能開発

Todo CRUD アプリケーションによる実証プロジェクト

---

## アジェンダ

1. **Subagent とは**
2. **本プロジェクトで試したいこと**
3. **本プロジェクトの概要**

---

# 1. Subagent とは

---

## Subagent とは

**大きな AI エージェントを、役割ごとに分割した小さな専門エージェント**

- 複雑なタスクを「役割」で分解
- 各 subagent は明確な責務と権限を持つ
- 文脈の分離により、効率的なタスク実行が可能

---

## 本プロジェクトの Subagent 構成

3つの専門エージェントで役割を分担

1. **Owner** - タスク分解担当
2. **Executer** - 実装担当
3. **Checker** - 品質担保担当

---

## Owner（タスク分解担当）

- 機能要件を 1 コミット単位の小粒度タスクに分解
- 受入基準（Given/When/Then）を明確化
- 依存関係・優先度を整理
- `docs/plans/tasks/*.md` を出力

**権限**: Read / Synthesize（コード編集はしない）

---

## Executer（実装担当）

- Owner のタスクを実装
- テストが通る状態まで持っていく
- 最小限のユニットテストを追加
- コミット単位で小さく実装

**権限**: Read / Edit / Bash

---

## Checker（品質担保担当）

- 受入基準に基づき包括的なテストを生成
- lint / 型チェック / UT を自動実行
- 改善提案を返す
- 不足ケース（境界値・異常系）を補う

**権限**: Read / Bash / Edit（テストファイルのみ）

---

## Subagent のメリット

3つの主要なメリット

- **文脈の分離** - 役割にフォーカス
- **権限の分離** - 責務が明確
- **並列化** - 同時進行可能

---

## メリット 1: 文脈の分離

- 各 subagent は自分の役割にのみフォーカス
- 不要な情報が文脈に混入しない
- タスクごとに必要最小限のコンテキスト

**→ トークン消費の最適化**

---

## メリット 2: 権限の分離

- Owner はコードを編集しない
- Checker は本体コードを編集しない（テストのみ）
- Executer はタスク定義を変更しない

**→ 責務が明確で安全**

---

## メリット 3: 並列化

- 独立したタスクを同時進行可能
- タスク間のコンテキスト分離
- 効率的なリソース活用

**→ コンテキスト管理の最適化**

---

# 2. 本プロジェクトで試したいこと

---

## 本プロジェクトの目的

### 🎯 主目的
**品質を担保しつつ、コンテキストの圧迫を防ぐ**

Subagent による役割分離で実現する

---

## 測定する指標

3つの観点で効果を測定

1. **コンテキスト管理** - 文脈の肥大化防止
2. **品質** - テストカバレッジ
3. **トークン消費** - 効率性

---

## 指標 1: コンテキスト管理

- 1タスクあたりのコンテキストサイズ
- タスク間の文脈の独立性
- 各 subagent が扱う情報量
- 再実行時のコンテキスト再利用率

---

## 指標 2: 品質

- Checker が追加したテストの網羅度
- 境界値・例外ケースのカバー率
- lint / 型チェックの通過率
- バグ混入率

---

## 指標 3: トークン消費

- Claude API の合計トークン数
- メッセージ数
- タスクあたりの平均トークン
- subagent 間のトークン配分

---

## 比較方法

### 2つのブランチで同じ機能を実装

1. **`release/agents`** ブランチ
   - owner / executer / checker を使用
   - 役割分離でコンテキスト管理

2. **`release/no-agents`** ブランチ（任意）
   - 単一エージェントで実装
   - 従来の開発フロー

**→ コンテキスト管理・品質・トークンを比較**

---

## 期待される効果

**Subagent あり**
- ✅ コンテキストが小さく管理しやすい
- ✅ 役割ごとに必要な情報のみ扱う
- ✅ テストの網羅性が高い
- ✅ 責務が明確で安全

**Subagent なし**
- ❓ コンテキストが肥大化しがち
- ❓ 全情報を常に扱う必要
- ❓ テストが不足する可能性

---

# 3. 本プロジェクトの概要

---

## プロジェクト概要

**Todo CRUD アプリケーション**を基盤として、段階的に機能を追加していく

### フェーズ 1: ベース実装（完了 ✅）
- React + TypeScript + Vite
- Hono (Node runtime)
- PostgreSQL + Prisma ORM
- Docker + Docker Compose 環境

### フェーズ 2: 機能追加（subagent 活用）
- フィルタ/ソート機能
- バリデーション強化
- アクセシビリティ改善
- 永続化・UI改善 など

---

## 技術スタック

- **Frontend**: React + TypeScript + Vite
- **Backend**: Hono (Node)
- **Database**: PostgreSQL + Prisma
- **Container**: Docker Compose
- **Dev Tools**: Biome, Makefile

---

## プロジェクト構造

```
apps/
  ├─ frontend/    # React + TS
  └─ backend/     # Hono API
prisma/           # DB schema
tests/            # Checker が生成
docs/
  ├─ plans/       # Owner のタスク定義
  └─ slides/      # 発表資料
.claude/agents/   # Subagent 定義
```

---

## クイックスタート

### 環境構築（2コマンドで完了）

```bash
# 初回セットアップ
make setup

# すべてのサービスを起動
make up
```

これで以下にアクセス可能：
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8787
- **Database**: localhost:5432

---

## Subagent の進行ループ

1. **Owner** - タスク分解
2. **Executer** - 実装 + 最小テスト
3. **Checker** - 包括的テスト + 検証
4. **合格** → コミット

並列可能なタスクは同時進行

---

## ループの詳細

**Owner** → `docs/plans/tasks/*.md` を生成

**Executer** → コード実装 + テストを緑化

**Checker** → テスト追加 + lint/型チェック実行

**判定** → 合格ならコミット、未達なら再実行

---

## 成果物

3種類のアーティファクトを生成

1. **タスク定義** - Owner が作成
2. **実行ログ** - 測定データ
3. **テスト** - Checker が生成

---

## 1. タスク定義

**`docs/plans/tasks/*.md`**

- 各タスクの Done 条件
- 受入基準（Given/When/Then）
- 変更対象・リスク

---

## 2. 実行ログ

**`docs/plans/run-log.md`**

- トークン/メッセージ数
- 失敗→再実行の回数
- 各サイクルの所要時間

---

## 3. テスト

**`tests/*.test.ts[x]`**

- Checker が生成した包括的なテスト
- 境界値・例外ケースをカバー

---

## ブランチ戦略

```
main
 ├─ (Todo CRUD ベース実装)
 │
 ├─ release/agents   ← subagents で機能追加
 │   └─> 今回はこちらで進める
 │
 └─ release/no-agents（任意・後日）
     └─> 同じ要件を subagents なしで実装し比較
```

---

## 現在の状況

### ✅ 完了
- ベース Todo CRUD アプリケーション
- Docker + Makefile による開発環境
- Biome による lint/format 環境
- PR テンプレート
- プロジェクト基盤の整備

### 🚀 次のステップ
1. `release/agents` ブランチ作成
2. `.claude/agents/` に owner/executer/checker を定義
3. 機能追加タスクの実行開始

---

## まとめ

### 本プロジェクトの特徴

1. **Subagent による文脈分離**
   - コンテキストの圧迫を防ぐ
   - 役割ごとに必要な情報のみ扱う

2. **品質の担保**
   - Checker による包括的なテスト
   - 境界値・例外ケースをカバー

3. **定量的な効果測定**
   - コンテキスト管理・品質・トークン

**→ 実用的な開発手法として実証**

---

# ご清聴ありがとうございました

**リポジトリ**: https://github.com/nanahiryu/cc-subagents-sample

**質問・フィードバック歓迎**
