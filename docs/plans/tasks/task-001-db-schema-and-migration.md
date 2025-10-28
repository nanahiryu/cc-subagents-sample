# タスク: DB Schema設計とマイグレーション

## 概要

タグ機能を実現するためのデータベーススキーマを設計し、Prismaマイグレーションを実行する。
Tag（タグマスタ）、TodoTag（中間テーブル）、Todo（関連追加）の3つのモデルを定義する。

## 実装スコープ

- [ ] Tagモデルの追加（id, name, createdAt）
- [ ] TodoTagモデルの追加（多対多の中間テーブル）
- [ ] Todoモデルにtags関連を追加
- [ ] Prismaマイグレーションファイルの生成
- [ ] マイグレーション実行の確認

## 受け入れ条件

1. Tag テーブルが作成されている
   - id: UUID（主キー）
   - name: VARCHAR(20)、UNIQUE制約
   - createdAt: DateTime
2. TodoTag テーブルが作成されている
   - todoId, tagId の複合主キー
   - todoId, tagId それぞれにインデックス
   - カスケード削除設定（Todo削除時、Tag削除時に関連レコードも削除）
3. Todo モデルに tags: TodoTag[] 関連が追加されている
4. `npx prisma migrate dev` が正常に完了する
5. Prisma Clientが正しく生成される

## 技術的考慮事項

- タグ名は UNIQUE 制約により重複を防ぐ
- TodoTag の複合主キーにより、同じTodoに同じTagを重複付与できない
- onDelete: Cascade により、Todo削除時にTodoTagも自動削除される
- インデックスを設定してクエリパフォーマンスを確保
- 既存のTodoデータには影響を与えない（後方互換性）

## 依存関係

- 前提: なし（このタスクが最初のタスク）
- 次タスク: Task-002, Task-003（このスキーマを利用）
