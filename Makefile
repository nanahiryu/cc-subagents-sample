.PHONY: help setup up down restart logs logs-backend logs-frontend logs-db ps migrate seed reset clean shell-backend shell-frontend shell-db lint format typecheck test

# デフォルトターゲット
help:
	@echo "利用可能なコマンド:"
	@echo "  make setup          - 初回セットアップ（依存関係インストール + DB起動 + マイグレーション + シード）"
	@echo "  make up             - すべてのサービスを起動"
	@echo "  make down           - すべてのサービスを停止"
	@echo "  make restart        - すべてのサービスを再起動"
	@echo "  make logs           - すべてのログを表示"
	@echo "  make logs-backend   - バックエンドのログを表示"
	@echo "  make logs-frontend  - フロントエンドのログを表示"
	@echo "  make logs-db        - データベースのログを表示"
	@echo "  make ps             - 実行中のコンテナを表示"
	@echo "  make migrate        - データベースマイグレーション"
	@echo "  make seed           - データベースにシードデータを投入"
	@echo "  make reset          - データベースをリセット（全データ削除 + マイグレーション + シード）"
	@echo "  make clean          - コンテナ・ボリューム・イメージをすべて削除"
	@echo "  make shell-backend  - バックエンドコンテナにシェルで入る"
	@echo "  make shell-frontend - フロントエンドコンテナにシェルで入る"
	@echo "  make shell-db       - データベースコンテナにシェルで入る"
	@echo "  make lint           - Biome でリンティング"
	@echo "  make format         - Biome でフォーマット"
	@echo "  make typecheck      - TypeScript 型チェック"
	@echo "  make test           - テスト実行"

# 初回セットアップ
setup:
	@echo "📦 依存関係をインストール中..."
	pnpm install
	@echo "🐳 Docker コンテナを起動中..."
	docker compose up -d postgres
	@echo "⏳ PostgreSQL の起動を待機中..."
	@sleep 5
	@echo "🔄 Prisma Client を生成中..."
	pnpm db:generate
	@echo "🗄️  データベースマイグレーション実行中..."
	pnpm db:migrate
	@echo "🌱 シードデータを投入中..."
	pnpm db:seed
	@echo "✅ セットアップ完了！'make up' でアプリを起動できます。"

# すべてのサービスを起動
up:
	@echo "🚀 すべてのサービスを起動中..."
	docker compose up -d
	@echo "✅ 起動しました！"
	@echo "   - Frontend: http://localhost:5173"
	@echo "   - Backend:  http://localhost:8787"
	@echo "   - Database: localhost:5432"

# すべてのサービスを停止
down:
	@echo "🛑 すべてのサービスを停止中..."
	docker compose down

# すべてのサービスを再起動
restart:
	@echo "🔄 すべてのサービスを再起動中..."
	docker compose restart

# すべてのログを表示
logs:
	docker compose logs -f

# バックエンドのログを表示
logs-backend:
	docker compose logs -f backend

# フロントエンドのログを表示
logs-frontend:
	docker compose logs -f frontend

# データベースのログを表示
logs-db:
	docker compose logs -f postgres

# 実行中のコンテナを表示
ps:
	docker compose ps

# データベースマイグレーション
migrate:
	@echo "🗄️  データベースマイグレーション実行中..."
	docker compose exec backend pnpm db:migrate

# シードデータを投入
seed:
	@echo "🌱 シードデータを投入中..."
	docker compose exec backend pnpm db:seed

# データベースをリセット
reset:
	@echo "⚠️  データベースをリセットします..."
	docker compose down -v
	docker compose up -d postgres
	@sleep 5
	pnpm db:generate
	pnpm db:migrate
	pnpm db:seed
	@echo "✅ データベースをリセットしました。"

# すべて削除（クリーンアップ）
clean:
	@echo "🧹 すべてのコンテナ・ボリューム・イメージを削除中..."
	docker compose down -v --rmi all
	@echo "✅ クリーンアップ完了。"

# バックエンドコンテナにシェルで入る
shell-backend:
	docker compose exec backend sh

# フロントエンドコンテナにシェルで入る
shell-frontend:
	docker compose exec frontend sh

# データベースコンテナにシェルで入る（psql）
shell-db:
	docker compose exec postgres psql -U user -d todo

# リンティング（ホスト環境で実行）
lint:
	pnpm lint

# フォーマット（ホスト環境で実行）
format:
	pnpm format

# 型チェック（ホスト環境で実行）
typecheck:
	pnpm typecheck

# テスト実行（ホスト環境で実行）
test:
	pnpm test
