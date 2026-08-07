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

  // Guards against cross-board card injection: a column id supplied by the
  // client must actually belong to the board the caller has access to.
  belongsToBoard: async (columnId: string, boardId: string) => {
    const column = await ColumnRepository.findByIdAndBoard(columnId, boardId);
    return !!column;
  },
};
