import { BoardReadRepository, BoardRepository } from "./board.repo";

export const BoardService = {
  createBoard: async (name: string) => {
    if (!name || !name.trim()) {
      throw new Error("Board name is required");
    }

    return BoardRepository.createWithDefaultColumns(name.trim());
  },
};

export const BoardQueryService = {
  listBoards: async () => {
    return BoardReadRepository.findAll();
  },

  getBoard: async (boardId: string) => {
    if (!boardId) {
      throw new Error("boardId is required");
    }

    const board = await BoardReadRepository.findById(boardId);

    if (!board) {
      throw new Error("Board not found");
    }

    return board;
  },
};
