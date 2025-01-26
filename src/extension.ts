import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// 追加: parseSchema をimport
import { getSchema } from '@mrleebo/prisma-ast';

// 既存のエラー定数
import { NO_WORKSPACE_ERROR, SCHEMA_NOT_FOUND_ERROR, SCHEMA_READ_ERROR } from './constants/errors';

import { SchemaCommandHandler } from './commands/schemaCommands';
import { PrismaSchemaService } from './services/prismaSchemaService';
import { SchemaWebviewProvider } from './webview/SchemaWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "prisma-gui-generator" is now active!');

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage(NO_WORKSPACE_ERROR);
    return;
  }

  const schemaService = new PrismaSchemaService(workspaceFolders[0].uri.fsPath);
  const webviewProvider = new SchemaWebviewProvider();
  const commandHandler = new SchemaCommandHandler(schemaService, webviewProvider);

  // =====================================================================================
  // 1. 既存のコマンド: schema.prismaを読み込んで内容を表示するだけ
  // =====================================================================================
  const disposable = vscode.commands.registerCommand('extension.readPrismaSchema', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage(NO_WORKSPACE_ERROR);
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const prismaPath = path.join(workspaceRoot, 'schema.prisma');

    if (!fs.existsSync(prismaPath)) {
      vscode.window.showErrorMessage(SCHEMA_NOT_FOUND_ERROR(prismaPath));
      return;
    }

    try {
      const schemaContent = fs.readFileSync(prismaPath, { encoding: 'utf-8' });
      vscode.window.showInformationMessage('schema.prisma content:');
      console.log('schema.prisma content:', schemaContent);
    } catch (error) {
      vscode.window.showErrorMessage(SCHEMA_READ_ERROR(error));
    }
  });

  // =====================================================================================
  // 2. 新コマンド: WebViewでPrismaスキーマのGUI表示
  // =====================================================================================
  const disposableWebView = vscode.commands.registerCommand(
    'extension.showSchemaView',
    () => commandHandler.handleShowSchemaView()
  );

  // コマンド登録
  context.subscriptions.push(disposable, disposableWebView);
}

export function deactivate() {}
