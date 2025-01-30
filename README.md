# Prisma GUI Generator

Prismaスキーマから視覚的にクエリを生成するためのVS Code拡張機能です。

## 機能一覧

### 1. フィールド選択機能
- 基本フィールドの選択
  - 各フィールドの横のチェックボックスで選択
  - テーブルごとの全フィールド一括選択

- リレーションフィールドの階層的な選択
  - リレーションフィールドに `→ モデル名` と表示
  - `Select fields` ボタンで関連フィールドを展開
  - 最大2階層までのネストされたリレーションをサポート

### 2. 条件設定機能（Where句）
- フィールドごとの条件設定
  - フィールドを選択すると条件設定UIが表示
  - フィールドの型に応じた適切な演算子を提供
    - 文字列型: equals, contains, startsWith, endsWith
    - 数値型: equals, gt, gte, lt, lte
    - 真偽値型: equals
    - 日時型: equals, gt, gte, lt, lte

- 複数条件の組み合わせ
  - `+ Add condition` ボタンで条件を追加
  - AND/ORで条件を組み合わせ
  - 条件の削除（×ボタン）

### 3. ソート機能（OrderBy句）
- 各フィールドのソート設定
  - ソートボタンのクリックで昇順（↑）→降順（↓）→解除
  - 複数フィールドのソートをサポート
  - ソートの優先順位を数字で表示

## 使い方

### 基本的な使い方
1. VS Codeでプロジェクトを開く
2. コマンドパレット（Cmd/Ctrl + Shift + P）を開く
3. "Show Prisma Schema Viewer" を実行
4. スキーマビューワーが表示され、モデルごとのカードが表示される

### フィールドの選択
1. 取得したいフィールドのチェックボックスをオン
2. リレーションフィールドの場合：
   - `Select fields` ボタンをクリック
   - 表示された関連フィールドから必要なものを選択

### 条件の設定
1. 条件を設定したいフィールドのチェックボックスをオン
2. 表示された条件設定UIで：
   - 演算子（equals, contains等）を選択
   - 値を入力
   - 必要に応じて `+ Add condition` で条件を追加
   - AND/ORを選択して条件を組み合わせ

### ソート順の設定
1. ソートしたいフィールドのソートボタンをクリック
   - 1回目のクリック：昇順（↑）
   - 2回目のクリック：降順（↓）
   - 3回目のクリック：ソート解除
2. 複数のフィールドでソートする場合：
   - クリックした順番が優先順位として表示
   - 生成されるクエリには優先順位順にソート条件が含まれる

### クエリの生成
1. 必要なフィールドの選択、条件設定、ソート設定が完了したら
2. 画面下部の `Generate Prisma Queries` ボタンをクリック
3. 生成されたPrismaクエリが表示される

## 生成されるクエリの例

### 基本的な選択
```typescript
const res = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true
  }
});
```

### リレーションを含む選択
```typescript
const res = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    posts: {
      select: {
        title: true,
        content: true,
        comments: {
          select: {
            content: true
          }
        }
      }
    }
  }
});
```

### 条件付きクエリ
```typescript
const res = await prisma.user.findMany({
  select: {
    id: true,
    email: true
  },
  where: {
    email: { contains: "@example.com" },
    AND: [
      { name: { startsWith: "John" } },
      { age: { gte: 20 } }
    ]
  }
});
```

### ソート付きクエリ
```typescript
const res = await prisma.user.findMany({
  select: {
    id: true,
    name: true
  },
  orderBy: [
    { createdAt: 'DESC' },
    { name: 'ASC' }
  ]
});
```

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
