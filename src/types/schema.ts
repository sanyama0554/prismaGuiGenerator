export interface SchemaField {
  name: string;
  type: string;
  isArray: boolean;
  isOptional: boolean;
  conditions?: string[];
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