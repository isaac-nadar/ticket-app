import { Card } from "../card/card.types";

export type Column = {
  id: string;
  name: string;
  position: number;
  boardId: string;
  cards: Card[];
};
