import { BoardReadRepository, BoardRepository } from "./board.repo";
import { redis } from "@/lib/redis";

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

    // A standard naming convention for Redis keys
    const CACHE_KEY = `board:${boardId}:data`;

    // 2. Try to get it from Redis first (The Cache Check)
    const cachedBoard = await redis.get(CACHE_KEY);

    if (cachedBoard) {
      console.log(`⚡ [Cache Hit] Serving board ${boardId} from Redis`);
      // Redis stores strings, so we parse it back to JSON
      return JSON.parse(cachedBoard);
    }

    // 3. If it's not in Redis, hit the Database (The Cache Miss)
    console.log(`🐌 [Cache Miss] Fetching board ${boardId} from Postgres`);
    const board = await BoardReadRepository.findById(boardId);

    if (!board) {
      throw new Error("Board not found");
    }

    // 4. Save it to Redis for next time, with a 30-second Time-To-Live (EX = seconds)
    await redis.set(CACHE_KEY, JSON.stringify(board), "EX", 30);

    return board;
  },
};
