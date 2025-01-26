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
  const disposableWebView = vscode.commands.registerCommand('extension.showSchemaView', async () => {
    const panel = vscode.window.createWebviewPanel(
      'prismaSchemaView',
      'Prisma Schema Viewer',
      vscode.ViewColumn.One,
      {
        enableScripts: true, // WebViewでJavaScriptを有効化
      }
    );

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
      const ast = getSchema(schemaContent);
      const models = ast.list.filter(item => item.type === 'model');

      const schemaData = models.map(model => ({
        name: model.name,
        fields: model.properties.map(prop => {
          if ('name' in prop && 'fieldType' in prop) {
            return {
              name: prop.name,
              type: prop.fieldType,
              isArray: 'array' in prop ? prop.array : false,
              isOptional: 'optional' in prop ? prop.optional : false,
            };
          }
          return null;
        }).filter(Boolean),
      }));

      panel.webview.html = getWebviewContent();

      // WebViewへモデル情報を送信
      panel.webview.postMessage({ command: 'loadSchema', data: schemaData });

      // WebViewからのメッセージを受信
      panel.webview.onDidReceiveMessage((message) => {
        switch (message.command) {
          case 'submitSelection':
            vscode.window.showInformationMessage(`Selected model: ${message.data.model}, fields: ${message.data.fields.join(', ')}`);
            console.log('User Selection:', message.data);
            break;
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage(SCHEMA_READ_ERROR(error));
    }
  });

  // コマンド登録
  context.subscriptions.push(disposable, disposableWebView);
}

// WebViewのHTMLコンテンツ
function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prisma Schema Viewer</title>
      <script>
        let schemaData = [];

        window.addEventListener('message', event => {
          const message = event.data;
          if (message.command === 'loadSchema') {
            schemaData = message.data;
            populateModels(schemaData);
          }
        });

        function populateModels(models) {
          const modelSelect = document.getElementById('modelSelect');
          modelSelect.innerHTML = '';
          models.forEach(model => {
            let option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            modelSelect.appendChild(option);
          });
          modelSelect.onchange = () => populateFields(models, modelSelect.value);
          populateFields(models, models[0].name);
        }

        function populateFields(models, selectedModel) {
          const model = models.find(m => m.name === selectedModel);
          const fieldsContainer = document.getElementById('fields');
          fieldsContainer.innerHTML = '';
          model.fields.forEach(field => {
            let div = document.createElement('div');
            div.innerHTML = \`
              <input type="checkbox" id="\${field.name}" value="\${field.name}">
              <label for="\${field.name}">\${field.name} (\${field.type})</label>
              <input type="text" id="condition_\${field.name}" placeholder="Condition">
            \`;
            fieldsContainer.appendChild(div);
          });
        }

        function submitSelection() {
          const model = document.getElementById('modelSelect').value;
          const selectedFields = [];
          document.querySelectorAll('#fields input[type="checkbox"]:checked').forEach(checkbox => {
            selectedFields.push({
              name: checkbox.value,
              condition: document.getElementById('condition_' + checkbox.value).value
            });
          });

          const vscode = acquireVsCodeApi();
          vscode.postMessage({
            command: 'submitSelection',
            data: {
              model,
              fields: selectedFields
            }
          });
        }
      </script>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #333; }
        select, button { margin: 10px 0; padding: 8px; }
      </style>
    </head>
    <body>
      <h2>Prisma Schema Viewer</h2>
      <label for="modelSelect">Select Model:</label>
      <select id="modelSelect"></select>
      <h3>Fields:</h3>
      <div id="fields"></div>
      <button onclick="submitSelection()">Submit Selection</button>
    </body>
    </html>
  `;
}

export function deactivate() {}
