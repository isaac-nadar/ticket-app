import { Column } from "../column/column.types";
import { User } from "../user/user.types";

export type CardType = "BUG" | "FEATURE";

export type Comment = {
  id: string;
  text: string;
  user: User;
  createdAt: string;
};

export type Attachment = {
  id: string;
  cardId: string;
  card: Card;
  userId: string;
  user: User;
  fileName: string;
  fileUrl: string;
  fileType: string; // e.g., "image/png", "application/pdf"
  sizeBytes: number;
  createdAt: string;
};

export type Card = {
  id: string;
  title: string;
  type: CardType;
  columnId: string;
  description?: string;
  assigneeId?: string;
  version: number;
  assignee: User;
  comments: Comment[];
  attachments: Attachment[];
  column?: Column;
  boardId?: string;
  board?: {
    title?: string;
  };
};
