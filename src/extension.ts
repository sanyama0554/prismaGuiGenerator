import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "prisma-gui-generator" is now active!');

  // コマンド登録: `extension.readPrismaSchema` という名前で登録
  let disposable = vscode.commands.registerCommand('extension.readPrismaSchema', async () => {
    // ワークスペースフォルダが開かれているかチェック
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder is open.');
      return;
    }

    // 一番最初のワークスペースフォルダを取得
    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    // schema.prisma のパスを作成
    const prismaPath = path.join(workspaceRoot, 'schema.prisma');

    // schema.prisma が存在するかチェック
    if (!fs.existsSync(prismaPath)) {
      vscode.window.showErrorMessage(`schema.prisma が見つかりません: ${prismaPath}`);
      return;
    }

    // ファイル読み込み
    try {
      const schemaContent = fs.readFileSync(prismaPath, { encoding: 'utf-8' });
      // 読み込んだ内容を表示(一旦シンプルに出力)
      vscode.window.showInformationMessage('schema.prisma content:', schemaContent);
      // コンソールにも出力
      console.log('schema.prisma content:', schemaContent);
    } catch (error) {
      vscode.window.showErrorMessage(`schema.prisma の読み込み中にエラーが発生しました: ${error}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
