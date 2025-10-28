# タスク: タグフィルタリング機能実装

## 概要

Todo一覧取得API（GET /api/todos）にタグによるフィルタリング機能を追加する。
複数タグでのAND/ORフィルタリングをサポートする。

## 実装スコープ

- [ ] GET /api/todos にクエリパラメータ tags を追加
- [ ] GET /api/todos にクエリパラメータ tagsMode を追加
- [ ] タグフィルタリングロジックの実装
- [ ] クエリスキーマの拡張
- [ ] 基本的なユニットテストの追加

## 受け入れ条件

1. GET /api/todos?tags=tag1,tag2 が実装されている
   - tags: カンマ区切りのタグ名リスト
   - 正規化されたタグ名で検索
   - レスポンス: 指定タグを持つTodoの配列
2. GET /api/todos?tags=tag1,tag2&tagsMode=and が実装されている
   - tagsMode: "and" | "or"（デフォルト: "or"）
   - "or": いずれかのタグを持つTodo
   - "and": すべてのタグを持つTodo
3. タグフィルタと他のフィルタの併用が可能
   - completed, q パラメータと組み合わせ可能
4. 存在しないタグ名でフィルタした場合は空配列を返す
5. 基本的なテストが追加されている
   - 正常系: ORフィルタ、ANDフィルタ、複合フィルタ

## 技術的考慮事項

- タグ名は正規化してから検索（Task-002の正規化関数を使用）
- Prisma の some / every を使ってフィルタリング
  - OR: `tags: { some: { tag: { name: { in: [...] } } } }`
  - AND: すべてのタグ名に対して some を組み合わせる
- パフォーマンス考慮: N+1問題を避けるため include でタグを取得
- getTodosQuerySchema を拡張してバリデーション

## 依存関係

- 前提: Task-001（DB schema）、Task-002（正規化関数）、Task-003（タグ取得）
- 次タスク: Task-005以降（フロントエンドでこのAPIを利用）
