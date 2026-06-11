import { ColumnRepository } from "./column.repo";
import { Column } from "./column.types";

export const ColumnService = {
  createColumn: async (boardId: string, name: string) => {
    if (!name.trim()) {
      throw new Error("Column name is required");
    }

    return ColumnRepository.create(boardId, name);
  },

  updateColumnPosition: async (columnId: string, newPosition: number) => {
    return ColumnRepository.updatePosition(columnId, newPosition);
  },
};
