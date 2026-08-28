import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signAccessToken } from "../lib/jwt";
import { AppError } from "../utils/AppError";
import type { LoginInput, RegisterInput } from "../validators/authValidators";

interface PublicUser {
  id: string;
  email: string;
  createdAt: Date;
}

interface AuthResult {
  user: PublicUser;
  token: string;
}

const passwordCost = 12;

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, passwordCost);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  return {
    user,
    token: signAccessToken(user.id),
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token: signAccessToken(user.id),
  };
}
