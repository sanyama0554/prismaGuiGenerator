import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// 追加: parseSchema をimport
import { getSchema } from '@mrleebo/prisma-ast';

// 既存のエラー定数
import { NO_WORKSPACE_ERROR, SCHEMA_NOT_FOUND_ERROR, SCHEMA_READ_ERROR } from './constants/errors';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "prisma-gui-generator" is now active!');

  // =====================================================================================
  // 1. 既存のコマンド: schema.prismaを読み込んで内容を表示するだけ
  // =====================================================================================
  const disposable = vscode.commands.registerCommand('extension.readPrismaSchema', async () => {
    // ワークスペースチェック
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
  // 2. 新コマンド: schema.prismaを読み込んでパースし、
  //                モデル・フィールド・リレーション情報をコンソール出力する例
  // =====================================================================================
  const disposableParse = vscode.commands.registerCommand('extension.parsePrismaSchema', async () => {
    // ワークスペースチェック
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
      const schemaContent = fs.readFileSync(prismaPath, 'utf-8');

      // parseSchemaでASTを取得
      const ast = getSchema(schemaContent);
      // ast.list[] の中にdatasource/generator/model/enumなどが並ぶ
      // type: 'model' の要素がモデル定義
      const models = ast.list.filter(item => item.type === 'model');

      // ログ出力のサンプル: モデル名・フィールド・リレーション属性など
      console.log('--- Parsed Models ---');
      for (const model of models) {
        console.log(`Model: ${model.name}`);

        // model.properties にフィールド・ブロック情報が入っている
        for (const prop of model.properties ?? []) {
          if (prop.type === 'field') {
            // フィールド名と型
            console.log(`  Field: ${prop.name} (${prop.fieldType}${prop.array ? '[]' : ''})`);

            // @relation(...) があればリレーション情報
            const relationAttr = prop.attributes?.find(a => a.name === 'relation');
            if (relationAttr) {
              // relationAttr.namedParameters から fields, references, name などを取り出せる
              const fieldsValue = relationAttr.args?.at(0)?.value; // ["someColumnId"] など
              const refsValue   = relationAttr.args?.at(1)?.value; // ["id"] など
              const relName     = relationAttr.args?.at(2)?.value;  // リレーション名があれば
              console.log(`    Relation found: fields=${JSON.stringify(fieldsValue)}, references=${JSON.stringify(refsValue)}, name=${relName || 'N/A'}`);
            }
          }
        }
      }

      vscode.window.showInformationMessage('Parsed schema.prisma. Check the console (Debug Console) for details.');
    } catch (error) {
      vscode.window.showErrorMessage(SCHEMA_READ_ERROR(error));
    }
  });

  // 登録
  context.subscriptions.push(disposable, disposableParse);
}

export function deactivate() {}
