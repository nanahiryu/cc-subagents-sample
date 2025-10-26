# cc-subagents-sample

Subagents（owner/executer/checker）を使用した体系的な機能開発を実証する Todo CRUD アプリケーション。

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Hono (Node runtime)
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **パッケージマネージャー**: pnpm

## プロジェクト構造

```
/
├─ apps/
│  ├─ frontend/       # React + TS
│  └─ backend/        # Hono API
├─ prisma/            # Prisma スキーマ / マイグレーション / シード
├─ tests/             # テストファイル
├─ docs/              # ドキュメント
│  ├─ requirements/
│  └─ plans/
└─ .claude/
   └─ agents/         # Subagent 定義
```

## セットアップ

### 前提条件

- Node.js 20+
- pnpm
- PostgreSQL（または Docker）

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. データベースのセットアップ

PostgreSQL を起動（Docker を使用する場合）:

```bash
docker run --name todo-postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=todo \
  -p 5432:5432 \
  -d postgres:16
```

テスト用データベースを作成:

```bash
docker exec -it todo-postgres psql -U user -d todo -c "CREATE DATABASE todo_test;"
```

### 3. 環境変数の設定

`.env.example` を `.env` にコピーして `DATABASE_URL` を更新:

```bash
cp .env.example .env
```

`.env` を編集:

```
DATABASE_URL="postgresql://user:password@localhost:5432/todo"
PORT=8787
```

### 4. マイグレーションの実行

```bash
pnpm db:migrate
pnpm db:generate
```

### 5. データベースのシード（任意）

```bash
pnpm db:seed
```

### 6. 開発サーバーの起動

別々のターミナルで実行:

```bash
# ターミナル 1: バックエンド (http://localhost:8787)
pnpm dev:backend

# ターミナル 2: フロントエンド (http://localhost:5173)
pnpm dev:frontend
```

または両方を同時に起動:

```bash
pnpm dev
```

## 利用可能なスクリプト

- `pnpm dev` - バックエンドとフロントエンドを両方起動
- `pnpm build` - 両方のアプリをビルド
- `pnpm lint` - Biome でリンティングを実行
- `pnpm lint:fix` - Biome でリンティングを実行し、自動修正
- `pnpm format` - Biome でコードをフォーマット
- `pnpm typecheck` - 型チェックを実行
- `pnpm test` - テストを実行
- `pnpm db:migrate` - Prisma マイグレーションを実行
- `pnpm db:generate` - Prisma クライアントを生成
- `pnpm db:seed` - サンプルデータでデータベースをシード

## API エンドポイント

- `GET /api/todos` - Todo 一覧を取得（フィルタリング可能）
- `POST /api/todos` - 新しい Todo を作成
- `GET /api/todos/:id` - 特定の Todo を取得
- `PATCH /api/todos/:id` - Todo を更新
- `DELETE /api/todos/:id` - Todo を削除

## 開発ワークフロー

このプロジェクトは subagent ベースのワークフローに従います:

1. **owner**: 機能を小さな 1 コミット単位のタスクに分解
2. **executer**: タスクを実装し、テストが通ることを確認
3. **checker**: 包括的なテストを追加し、品質を検証

タスク定義と実行ログについては `docs/plans/` を参照してください。