export const NO_WORKSPACE_ERROR = 'ワークスペースが開かれていません。';

export const SCHEMA_NOT_FOUND_ERROR = (path: string) => `schema.prismaが見つかりません: ${path}`;
export const SCHEMA_READ_ERROR = (error: unknown) => `schema.prismaの読み込みに失敗しました: ${error}`;
