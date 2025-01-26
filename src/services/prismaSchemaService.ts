import * as fs from 'fs';
import * as path from 'path';
import { getSchema } from '@mrleebo/prisma-ast';
import { SchemaData, SchemaModel } from '../types/schema';

export class PrismaSchemaService {
  constructor(private readonly workspaceRoot: string) {}

  async readSchema(): Promise<string> {
    const prismaPath = this.getPrismaPath();
    if (!fs.existsSync(prismaPath)) {
      throw new Error(`Schema not found at ${prismaPath}`);
    }
    return fs.promises.readFile(prismaPath, 'utf-8');
  }

  async parseSchema(): Promise<SchemaData> {
    const content = await this.readSchema();
    const ast = getSchema(content);
    const models = ast.list
      .filter(item => item.type === 'model')
      .map(model => this.transformModel(model));

    return { models };
  }

  private getPrismaPath(): string {
    return path.join(this.workspaceRoot, 'schema.prisma');
  }

  private transformModel(model: any): SchemaModel {
    return {
      name: model.name,
      fields: model.properties
        .filter((prop: any) => 'name' in prop && 'fieldType' in prop)
        .map((prop: any) => ({
          name: prop.name,
          type: prop.fieldType,
          isArray: 'array' in prop ? prop.array : false,
          isOptional: 'optional' in prop ? prop.optional : false,
        }))
    };
  }
} 