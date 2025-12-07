import {FieldValue} from "firebase-admin/firestore";
import {AppError} from "../utils/appError";
import {UserRepo, type User} from "../repositories/userRepository";

const MAX_BIO_LENGTH = 500;
const MAX_STACKS = 20;

export type UserProfile = User & {displayProfileImageUrl: string};

export class UserService {
  private userRepo = new UserRepo();

  async getMe(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }
    return this.decorateUser(user);
  }

  async updateProfile(userId: string, body: Record<string, unknown>): Promise<UserProfile> {
    const updateData: Record<string, unknown> = {};
    const basicFields = ["name", "phone", "department", "studentId"] as const;

    basicFields.forEach((field) => {
      if (typeof body[field] === "string") {
        updateData[field] = (body[field] as string).trim();
      }
    });

    if (typeof body.bio === "string") {
      const trimmed = body.bio.trim();
      if (trimmed.length > MAX_BIO_LENGTH) {
        throw new AppError(400, "INVALID_ARGUMENT", "bio exceeds maximum length");
      }
      updateData.bio = trimmed;
    }

    if (Array.isArray(body.stacks)) {
      const stacks = body.stacks.map((entry) => String(entry).trim()).filter(Boolean);
      if (stacks.length > MAX_STACKS) {
        throw new AppError(400, "INVALID_ARGUMENT", "stacks exceeds maximum length");
      }
      updateData.stacks = stacks;
    }

    if ("profileImageUrl" in body) {
      const value = body.profileImageUrl;
      if (value === null || value === "") {
        updateData.profileImageUrl = FieldValue.delete();
      } else if (typeof value === "string") {
        updateData.profileImageUrl = value;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.userRepo.updateUser(userId, updateData);
    }

    return this.getMe(userId);
  }

  private decorateUser(user: User): UserProfile {
    return {
      ...user,
      displayProfileImageUrl: user.profileImageUrl ?? user.githubProfileImageUrl ?? "",
    };
  }
}
