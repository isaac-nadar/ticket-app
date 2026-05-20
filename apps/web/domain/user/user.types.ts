export type User = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  name?: string | null;
  avatar?: string | null;
};
