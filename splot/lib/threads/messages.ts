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

/** One message as ROPS sees it in /admin/messages: which side wrote it, and whether it was the reader. */
export type StaffThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  /** Written by the submission's author; anything else comes from ROPS. */
  fromAuthor: boolean;
  isOwn: boolean;
};

export function toStaffThreadMessage(row: MessageRow, authorId: string, userId: string): StaffThreadMessage {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    fromAuthor: row.author_id === authorId,
    isOwn: row.author_id === userId,
  };
}
