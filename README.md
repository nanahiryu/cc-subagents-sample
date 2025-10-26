# cc-subagents-sample

Subagents（owner/executer/checker）を使用した体系的な機能開発を実証する Todo CRUD アプリケーション。

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Hono (Node runtime)
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **パッケージマネージャー**: pnpm
- **コンテナ**: Docker + Docker Compose
- **タスクランナー**: Makefile

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

- Docker & Docker Compose
- pnpm（ローカル開発時のみ）
- Make

### クイックスタート（Docker 環境）

```bash
# 初回セットアップ（依存関係 + DB起動 + マイグレーション + シード）
make setup

# すべてのサービスを起動
make up
```

これだけで以下にアクセスできます：
- **フロントエンド**: http://localhost:5173
- **バックエンド**: http://localhost:8787
- **データベース**: localhost:5432

### ローカル開発（Docker なし）

Docker を使わずにローカルで開発する場合：

1. **依存関係のインストール**
   ```bash
   pnpm install
   ```

2. **PostgreSQL を起動**（別途必要）
   ```bash
   docker run --name todo-postgres \
     -e POSTGRES_USER=user \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=todo \
     -p 5432:5432 \
     -d postgres:16
   ```

3. **環境変数の設定**
   ```bash
   cp .env.example .env
   ```

4. **マイグレーションとシード**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

5. **開発サーバー起動**
   ```bash
   pnpm dev
   ```

## 利用可能なコマンド

### Makefile コマンド（推奨）

Docker 環境での操作は Makefile で簡単に実行できます：

```bash
make help              # すべてのコマンドを表示
make setup             # 初回セットアップ
make up                # すべてのサービスを起動
make down              # すべてのサービスを停止
make restart           # すべてのサービスを再起動
make logs              # すべてのログを表示
make logs-backend      # バックエンドのログを表示
make logs-frontend     # フロントエンドのログを表示
make logs-db           # データベースのログを表示
make ps                # 実行中のコンテナを表示
make migrate           # データベースマイグレーション
make seed              # シードデータを投入
make reset             # データベースをリセット
make clean             # すべてのコンテナ・ボリュームを削除
make shell-backend     # バックエンドコンテナにシェルで入る
make shell-frontend    # フロントエンドコンテナにシェルで入る
make shell-db          # データベースにpsqlで接続
make lint              # Biome でリンティング
make format            # Biome でフォーマット
make typecheck         # TypeScript 型チェック
make test              # テスト実行
```

### pnpm スクリプト（ローカル開発用）

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