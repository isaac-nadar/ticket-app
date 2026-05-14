import { AuthUser } from "@/lib/auth";
import { Column } from "../column/column.types";

export type Board = {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any[];
  boardId: string;
  createdAt: string;
  columns: Column[];
};

export type BoardUser = {
  id: string;
  boardId: string;
  userId: string;
  board: Board;
  user: AuthUser;
};
