// domain/user/user.service.ts
import { UserRepository } from "./user.repo";
import bcrypt from "bcrypt";
// import { EmailService } from "../email/email.service";

export const UserService = {
  createUser: async (data: {
    name: string;
    email: string;
    passwordHash: string;
    role: "USER" | "ADMIN";
  }) => {
    // 1. Repo handles the DB
    const user = await UserRepository.create(data);

    // 2. Service handles the business side-effects
    // await EmailService.sendWelcome(user.email);

    return user;
  },

  getAllUsers: async () => {
    return UserRepository.listAllUsers();
  },

  getUserById: async (id: string) => {
    return UserRepository.findById(id);
  },

  checkUser: async (email: string) => {
    return UserRepository.checkUser(email);
  },

  updatePassword: async (userId: string, passwordHash: string) => {
    return UserRepository.updatePassword(userId, passwordHash);
  },

  updateName: async (userId: string, name: string) => {
    return UserRepository.updateProfile(userId, name);
  },

  changePassword: async (userId: string, oldPass: string, newPass: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(oldPass, user.password);
    if (!isValid) throw new Error("Incorrect current password");

    const newHash = await bcrypt.hash(newPass, 10);

    return UserRepository.updatePassword(userId, newHash);
  },

  listAllUsersNotInBoard: async (boardId: string) => {
    return UserRepository.listAllUsersNotInBoard(boardId);
  },
};
