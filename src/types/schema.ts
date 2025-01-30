export interface SchemaField {
  name: string;
  type: string;
  isArray: boolean;
  isOptional: boolean;
  conditions?: string[];
  relation?: {
    name?: string;
    fields?: string[];
    references?: string[];
    target: string;
    onDelete?: string;
  };
}

export interface SchemaModel {
  name: string;
  fields: SchemaField[];
}

export interface SchemaData {
  models: SchemaModel[];
}

export interface WebViewMessage {
  command: 'loadSchema' | 'submitSelection';
  data: any;
} 