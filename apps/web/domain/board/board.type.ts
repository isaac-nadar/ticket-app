import { AuthUser } from "@/lib/auth";
import { Column } from "../column/column.types";

export type Board = {
  id: string;
  name: string;
  prefix: string;
  users: BoardUser[];
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
  name: string;
};
