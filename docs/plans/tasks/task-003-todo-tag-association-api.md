# タスク: Todo-Tag関連付けAPI実装

## 概要

TodoにTagを付与・削除する機能を実装する。
Todo作成・更新時のタグ指定、個別のタグ付与・削除エンドポイントを提供する。

## 実装スコープ

- [ ] POST /api/todos/:todoId/tags - Todoにタグを付与
- [ ] DELETE /api/todos/:todoId/tags/:tagId - Todoからタグを削除
- [ ] POST /api/todos のリクエストボディに tags を追加
- [ ] PATCH /api/todos/:id のリクエストボディに tags を追加
- [ ] Todo取得時にタグ情報を含める（include設定）
- [ ] 基本的なユニットテストの追加

## 受け入れ条件

1. POST /api/todos/:todoId/tags が実装されている
   - リクエストボディ: `{ tagNames: string[] }`
   - 既存タグは関連付け、未存在タグは作成して関連付け
   - レスポンス: Todo（tags を含む）
   - 存在しないTodoIDの場合は404エラー
2. DELETE /api/todos/:todoId/tags/:tagId が実装されている
   - レスポンス: 204 No Content
   - 存在しないTodoまたはTagの場合は404エラー
3. POST /api/todos にタグ指定機能を追加
   - リクエストボディに `tags?: string[]` を追加
   - Todo作成と同時にタグを付与
4. PATCH /api/todos/:id にタグ更新機能を追加
   - リクエストボディに `tags?: string[]` を追加
   - 指定されたタグに完全置換（既存タグは削除、新規タグを設定）
5. Todo取得時（GET）にタグ情報を含む
   - tags配列に `{ tag: { id, name } }` が含まれる
6. 基本的なテストが追加されている
   - 正常系: タグ付与、タグ削除、Todo作成時タグ指定

## 技術的考慮事項

- タグ名正規化は Task-002 で実装した関数を再利用
- タグ付与時、既存タグの場合はそのまま関連付け、未存在なら作成
- タグ削除時、どのTodoからも参照されなくなったTagは自動削除しない（仕様）
- Prisma の include を使ってタグ情報を取得
- 重複タグの付与は冪等性を保つ（エラーにしない）
- schemas.ts のcreate/updateスキーマを拡張

## 依存関係

- 前提: Task-001（DB schema）、Task-002（Tag API、正規化関数）
- 次タスク: Task-004（このAPIを利用）
