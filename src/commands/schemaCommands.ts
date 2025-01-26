import * as vscode from 'vscode';
import { PrismaSchemaService } from '../services/prismaSchemaService';
import { SchemaWebviewProvider } from '../webview/SchemaWebviewProvider';
import { NO_WORKSPACE_ERROR, SCHEMA_READ_ERROR } from '../constants/errors';

export class SchemaCommandHandler {
  constructor(
    private readonly schemaService: PrismaSchemaService,
    private readonly webviewProvider: SchemaWebviewProvider
  ) {}

  async handleShowSchemaView(): Promise<void> {
    try {
      const schemaData = await this.schemaService.parseSchema();
      this.webviewProvider.updateContent(schemaData);
      this.setupMessageHandling();
    } catch (error) {
      vscode.window.showErrorMessage(SCHEMA_READ_ERROR(error));
    }
  }

  private setupMessageHandling(): void {
    this.webviewProvider.onMessage((message) => {
      switch (message.command) {
        case 'submitSelection':
          this.handleSubmitSelection(message.data);
          break;
      }
    });
  }

  private handleSubmitSelection(data: any): void {
    vscode.window.showInformationMessage(
      `Selected model: ${data.model}, fields: ${data.fields.join(', ')}`
    );
    console.log(`Selected model: ${data.model}, fields: ${data.fields.join(', ')}`);
  }
} 