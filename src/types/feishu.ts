export interface FieldMeta { id: string; name: string; type: string }
export interface RawRecord { record_id: string; fields: Record<string, unknown> }
export interface Quote { id: number; text: string; author: string; category: string }
export interface Payload {
  source: string;
  updatedAt: string;
  schema: FieldMeta[];
  records: RawRecord[];
  quotes: Quote[];
  etag?: string;
}