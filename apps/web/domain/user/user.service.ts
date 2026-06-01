// domain/user/user.service.ts
import { UserRepository } from "./user.repo";
// import { EmailService } from "../email/email.service";

export const UserService = {
  createUser: async (data: {
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
};
