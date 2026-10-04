/** One message in the author's own thread. */
export type ThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  /** Written by the reader; anything else in the thread comes from ROPS. */
  isOwn: boolean;
};

/** Columns of `messages` that ThreadMessage is built from, also on Realtime payloads. */
export type MessageRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
};

export function toThreadMessage(row: MessageRow, userId: string): ThreadMessage {
  return { id: row.id, body: row.body, createdAt: row.created_at, isOwn: row.author_id === userId };
}
