import { UserModel, User, CreateUserInput } from "../models/user.model";
import { generateToken } from "../utils/jwt.util";

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    initialen: string;
    rolle: string;
    berechtigungen?: string[];
    avatarUrl?: string;
  };
  token: string;
}

export class AuthService {
  static async login(username: string, password: string): Promise<LoginResult> {
    console.log("AuthService.login called with username:", username);
    // Versuche zuerst nach Name, dann nach E-Mail zu suchen
    let user = await UserModel.findByName(username);
    if (!user) {
      user = await UserModel.findByEmail(username);
    }
    console.log("User found:", user ? `Yes (${user.name})` : "No");
    
    if (!user) {
      throw new Error("Ungültiger Benutzername oder Passwort");
    }

    const isValid = await UserModel.verifyPassword(user, password);
    console.log("Password valid:", isValid);
    if (!isValid) {
      throw new Error("Ungültiger Benutzername oder Passwort");
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      rolle: user.rolle,
    });

    return {
      user: UserModel.toPublic(user),
      token,
    };
  }

  static async register(input: CreateUserInput): Promise<LoginResult> {
    const existingUser = await UserModel.findByEmail(input.email);
    if (existingUser) {
      throw new Error("E-Mail bereits registriert");
    }

    const user = await UserModel.create(input);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      rolle: user.rolle,
    });

    return {
      user: UserModel.toPublic(user),
      token,
    };
  }

  static async getCurrentUser(userId: string): Promise<User | null> {
    return UserModel.findById(userId);
  }
}

