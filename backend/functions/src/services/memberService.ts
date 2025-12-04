import {Timestamp} from "firebase-admin/firestore";
import {MemberData, MemberRole} from "../types/member";
import {MemberRepository, MemberRepo, type Member} from "../repositories/memberRepository";
import * as logger from "firebase-functions/logger";
import {stripUndefined} from "../utils/clean";
import {toFirestorePatch} from "../utils/patch";
import {AppError} from "../utils/appError";
import {generateLinkCode, hashLinkCode} from "../utils/hash";
import {UserRepo} from "../repositories/userRepository";

// GitHub API를 통한 프로필 사진 가져오기
async function fetchGitHubProfileImage(githubUsername: string): Promise<string> {
  try {
    // GitHub API를 통해 사용자 정보 가져오기
    const response = await fetch(`https://api.github.com/users/${githubUsername}`, {
      headers: {
        "User-Agent": "GDGoC-Website",
        "Accept": "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      // API 실패 시 기본 프로필 사진 URL 반환
      logger.warn(`GitHub API failed for ${githubUsername}, using default avatar`);
      return `https://github.com/${githubUsername}.png`;
    }

    const userData = await response.json();
    return userData.avatar_url || `https://github.com/${githubUsername}.png`;
  } catch (error) {
    logger.error("Error fetching GitHub profile", error);
    // 에러 발생 시 기본 프로필 사진 URL 반환
    return `https://github.com/${githubUsername}.png`;
  }
}

// 비즈니스 로직 레이어
export class MemberService {
  private memberRepo: MemberRepository;

  constructor() {
    this.memberRepo = new MemberRepository();
  }

  // 멤버 생성
  async createMember(
    name: string,
    email: string,
    department: string,
    githubUsername: string
  ): Promise<MemberData> {
    // GitHub 프로필 사진 가져오기
    const profileImageUrl = await fetchGitHubProfileImage(githubUsername);

    const memberData: Omit<MemberData, "id"> = stripUndefined({
      name,
      email,
      department,
      githubUsername,
      profileImageUrl,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const id = await this.memberRepo.create(memberData);

    logger.info("Member created", {id, name, email});

    return {
      id,
      ...memberData,
    };
  }

  // 멤버 목록 조회 (프로필 사진 최신화)
  async getMembers(limit: number = 50, offset: number = 0): Promise<{
    members: MemberData[];
    total: number;
  }> {
    const members = await this.memberRepo.findAll(limit, offset);

    // 각 멤버의 프로필 사진을 최신화
    const updatedMembers = await Promise.all(
      members.map(async (member) => {
        try {
          if (!member.githubUsername) {
            return member;
          }

          const latestProfileImageUrl = await fetchGitHubProfileImage(member.githubUsername);

          // 프로필 사진이 변경된 경우 업데이트
          if (latestProfileImageUrl !== member.profileImageUrl) {
            const updatePayload = stripUndefined({
              profileImageUrl: latestProfileImageUrl,
              updatedAt: Timestamp.now(),
            });
            const patchPayload = toFirestorePatch(updatePayload as Record<string, unknown>);

            await this.memberRepo.update(
              member.id!,
              patchPayload as Partial<MemberData>
            );

            return {
              ...member,
              profileImageUrl: latestProfileImageUrl,
            };
          }

          return member;
        } catch (error) {
          logger.warn(`Failed to update profile image for ${member.githubUsername}`, error);
          return member;
        }
      })
    );

    return {
      members: updatedMembers,
      total: updatedMembers.length,
    };
  }

  // 단일 멤버 조회 (프로필 사진 최신화)
  async getMember(memberId: string): Promise<MemberData> {
    const member = await this.memberRepo.findById(memberId);

    if (!member) {
      throw new Error("Member not found");
    }

    // 프로필 사진 최신화
    try {
      if (!member.githubUsername) {
        return member;
      }

      const latestProfileImageUrl = await fetchGitHubProfileImage(member.githubUsername);

      if (latestProfileImageUrl !== member.profileImageUrl) {
        const updatePayload = stripUndefined({
          profileImageUrl: latestProfileImageUrl,
          updatedAt: Timestamp.now(),
        });
        const patchPayload = toFirestorePatch(updatePayload as Record<string, unknown>);
        const updated = await this.memberRepo.update(
          member.id!,
          patchPayload as Partial<MemberData>
        );
        return updated;
      }
    } catch (error) {
      logger.warn(`Failed to update profile image for ${member.githubUsername}`, error);
    }

    return member;
  }

  // 멤버 업데이트
  async updateMember(
    memberId: string,
    updateData: Partial<Pick<MemberData, "name" | "email" | "department" | "githubUsername" | "isAdmin">>
  ): Promise<MemberData> {
    const updatePayload: Partial<MemberData> = {
      updatedAt: Timestamp.now(),
      ...updateData,
    };

    // GitHub 사용자명이 변경된 경우 프로필 사진도 업데이트
    if (updateData.githubUsername) {
      const profileImageUrl = await fetchGitHubProfileImage(updateData.githubUsername);
      updatePayload.profileImageUrl = profileImageUrl;
    }

    const sanitizedPayload = stripUndefined(updatePayload);
    const patchPayload = toFirestorePatch(sanitizedPayload as Record<string, unknown>);

    return await this.memberRepo.update(
      memberId,
      patchPayload as Partial<MemberData>
    );
  }

  // 멤버 삭제
  async deleteMember(memberId: string): Promise<void> {
    await this.memberRepo.delete(memberId);
    logger.info("Member deleted", {id: memberId});
  }
}

export class MemberLinkService {
  private memberRepo = new MemberRepo();
  private userRepo = new UserRepo();

  async linkMember(userId: string, linkCode: string): Promise<void> {
    if (!linkCode) {
      throw new AppError(400, "INVALID_ARGUMENT", "linkCode is required");
    }

    const codeHash = hashLinkCode(linkCode);
    const member = await this.memberRepo.findByLinkCodeHash(codeHash);
    if (!member || !member.id) {
      throw new AppError(404, "LINK_CODE_INVALID", "Invalid link code");
    }
    if (member.linkCodeUsedAt) {
      throw new AppError(403, "LINK_CODE_USED", "Link code already used");
    }
    if (member.linkCodeExpiresAt && member.linkCodeExpiresAt.toMillis() < Date.now()) {
      throw new AppError(403, "LINK_CODE_EXPIRED", "Link code expired");
    }
    if (member.userId) {
      throw new AppError(409, "MEMBER_ALREADY_LINKED", "Member already linked");
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }
    if (user.memberId) {
      throw new AppError(409, "MEMBER_ALREADY_LINKED", "User already linked");
    }

    await this.memberRepo.linkUserToMember(member.id, user.id);

  }
}

interface CreateMemberDto {
  name: string;
  studentId: string;
  department: string;
  generation: number;
  role: MemberRole;
  blogName?: string;
  blogDescription?: string;
}

const DEFAULT_LINK_EXPIRY_DAYS = 7;

export class MemberAdminService {
  private memberRepo = new MemberRepo();

  async createMember(dto: CreateMemberDto): Promise<{member: Member; linkCode: string}> {
    const existing = await this.memberRepo.findByStudentId(dto.studentId);
    if (existing) {
      throw new AppError(409, "MEMBER_CONFLICT", "Member with this studentId already exists");
    }

    const linkCode = generateLinkCode();
    const hash = hashLinkCode(linkCode);
    const expiresAt = this.computeExpiry(DEFAULT_LINK_EXPIRY_DAYS);

    const memberData: MemberData = {
      name: dto.name,
      studentId: dto.studentId,
      department: dto.department,
      generation: dto.generation,
      role: dto.role,
      blogName: dto.blogName,
      blogDescription: dto.blogDescription,
      linkCodeHash: hash,
      linkCodeExpiresAt: Timestamp.fromDate(expiresAt),
      linkCodeUsedAt: null,
    };

    const member = await this.memberRepo.createMember(memberData);
    return {member, linkCode};
  }

  async resetLinkCode(memberId: string, expiresInDays?: number): Promise<{member: Member; linkCode: string}> {
    const member = await this.memberRepo.findById(memberId);
    if (!member) {
      throw new AppError(404, "MEMBER_NOT_FOUND", "Member not found");
    }
    const linkCode = generateLinkCode();
    const hash = hashLinkCode(linkCode);
    const days = typeof expiresInDays === "number" && expiresInDays > 0 ? expiresInDays : DEFAULT_LINK_EXPIRY_DAYS;
    const expiresAt = this.computeExpiry(days);
    const updated = await this.memberRepo.updateMemberLinkCode(memberId, hash, expiresAt);
    return {member: updated, linkCode};
  }

  private computeExpiry(days: number): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
