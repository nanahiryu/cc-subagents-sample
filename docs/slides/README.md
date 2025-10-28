# プロジェクト発表スライド

このディレクトリには、Marp を使用したプロジェクトの発表スライドが含まれています。

## スライド一覧

- `project-overview.md` - プロジェクト概要スライド
  - Subagent とは
  - 本プロジェクトで試したいこと
  - 本プロジェクトの概要

## スライドの表示方法

### 1. VSCode + Marp 拡張機能（推奨）

1. VSCode に [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) をインストール
2. `project-overview.md` を開く
3. 右上の「Open Preview to the Side」アイコンをクリック

### 2. Marp CLI を使用

```bash
# Marp CLI をインストール
npm install -g @marp-team/marp-cli

# HTML に変換
marp project-overview.md -o project-overview.html

# PDF に変換
marp project-overview.md -o project-overview.pdf

# ライブプレビュー
marp -s project-overview.md
```

### 3. オンラインエディタ

https://web.marp.app/ にアクセスして、`project-overview.md` の内容をコピー＆ペースト

## スライドの編集

Markdown 形式で記述されているため、通常のテキストエディタで編集可能です。

- `---` でスライドを区切る
- 通常の Markdown 記法が使える
- YAML frontmatter でテーマやページ番号を設定

詳細は [Marp 公式ドキュメント](https://marpit.marp.app/) を参照してください。
