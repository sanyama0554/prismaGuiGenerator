import * as vscode from 'vscode';
import { SchemaData } from '../types/schema';
import { getWebviewContent } from './webviewContent';

export class SchemaWebviewProvider {
  private panel: vscode.WebviewPanel;

  constructor() {
    this.panel = this.createPanel();
  }

  private createPanel(): vscode.WebviewPanel {
    return vscode.window.createWebviewPanel(
      'prismaSchemaView',
      'Prisma Schema Viewer',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
  }

  updateContent(schemaData: SchemaData): void {
    this.panel.webview.html = getWebviewContent();
    this.panel.webview.postMessage({ 
      command: 'loadSchema', 
      data: schemaData 
    });
  }

  onMessage(callback: (message: any) => void): void {
    this.panel.webview.onDidReceiveMessage(callback);
  }
} 