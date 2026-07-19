export type User = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  name: string;
  avatar?: string | null;
};
