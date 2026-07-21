import { User, type IUserDocument } from "./model";

export const authRepository = {
  async create(
    name: string,
    email: string,
    password: string
  ): Promise<IUserDocument> {
    const user = await User.create({ name, email, password });
    return user;
  },

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return User.findOne({ email }).select("+password");
  },

  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id);
  },
};
