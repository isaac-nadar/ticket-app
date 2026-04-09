export type CreateCardInput = {
  title: string;
  type: "BUG" | "FEATURE";
};

export type MoveCardInput = {
  cardId: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
};
