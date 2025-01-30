import * as fs from 'fs';
import * as path from 'path';
import { getSchema } from '@mrleebo/prisma-ast';
import { SchemaData, SchemaModel } from '../types/schema';

export class PrismaSchemaService {
  // 基本型の定義
  private readonly PRIMITIVE_TYPES = new Set([
    'String',
    'Boolean',
    'Int',
    'BigInt',
    'Float',
    'Decimal',
    'DateTime',
    'Json',
    'Bytes'
  ]);

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
        .map((prop: any) => {
          const field = {
            name: prop.name,
            type: prop.fieldType,
            isArray: 'array' in prop ? prop.array : false,
            isOptional: 'optional' in prop ? prop.optional : false,
          };

          // リレーション情報の抽出
          if (prop.attributes) {
            const relationAttr = prop.attributes.find((attr: any) => attr.name === 'relation');
            if (relationAttr) {
              const relationFields = relationAttr.args.find((arg: any) => arg.name === 'fields')?.value ?? [];
              const relationReferences = relationAttr.args.find((arg: any) => arg.name === 'references')?.value ?? [];
              const onDelete = relationAttr.args.find((arg: any) => arg.name === 'onDelete')?.value;

              return {
                ...field,
                relation: {
                  name: relationAttr.args.find((arg: any) => arg.name === 'name')?.value,
                  fields: Array.isArray(relationFields) ? relationFields : [relationFields],
                  references: Array.isArray(relationReferences) ? relationReferences : [relationReferences],
                  target: prop.fieldType,
                  onDelete
                }
              };
            }
          }

          // 配列型のフィールドの場合、それはリレーションである可能性が高い
          if (field.isArray) {
            const baseType = prop.fieldType.replace('[]', '');
            // 基本型の配列は除外
            if (!this.PRIMITIVE_TYPES.has(baseType)) {
              return {
                ...field,
                relation: {
                  target: baseType
                }
              };
            }
          }

          // フィールドの型が他のモデルを参照している場合
          // 基本型は除外
          if (/^[A-Z]/.test(prop.fieldType) && !this.PRIMITIVE_TYPES.has(prop.fieldType)) {
            return {
              ...field,
              relation: {
                target: prop.fieldType
              }
            };
          }

          return field;
        })
    };
  }
} 