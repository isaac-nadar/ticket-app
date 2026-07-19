import { Board } from "../board/board.type";
import { Card } from "../card/card.types";

export type Column = {
  id: string;
  name: string;
  position: number;
  boardId: string;
  isBacklog?: boolean;
  cards: Card[];
  board?: Board;
};
