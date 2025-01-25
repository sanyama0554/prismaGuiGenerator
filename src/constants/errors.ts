export const NO_WORKSPACE_ERROR = 'No workspace folder is open.';

export const SCHEMA_NOT_FOUND_ERROR = (path: string) => `schema.prisma が見つかりません: ${path}`;
export const SCHEMA_READ_ERROR = (error: unknown) => `schema.prisma の読み込み中にエラーが発生しました: ${error}`;
