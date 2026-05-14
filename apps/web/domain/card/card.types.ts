export type CardType = "BUG" | "FEATURE";

export type Card = {
  id: string;
  title: string;
  type: CardType;
  columnId: string;
  description?: string;
  assigneeId?: string;
  version: number;
};
