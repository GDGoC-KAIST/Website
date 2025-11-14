import {Timestamp} from "firebase-admin/firestore";
import {MemberData} from "../types/member";
import {MemberRepository} from "../repositories/memberRepository";
import * as logger from "firebase-functions/logger";

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

    const memberData: Omit<MemberData, "id"> = {
      name,
      email,
      department,
      githubUsername,
      profileImageUrl,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

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
          const latestProfileImageUrl = await fetchGitHubProfileImage(
            member.githubUsername
          );

          // 프로필 사진이 변경된 경우 업데이트
          if (latestProfileImageUrl !== member.profileImageUrl) {
            await this.memberRepo.update(member.id!, {
              profileImageUrl: latestProfileImageUrl,
              updatedAt: Timestamp.now(),
            });

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
      const latestProfileImageUrl = await fetchGitHubProfileImage(member.githubUsername);

      if (latestProfileImageUrl !== member.profileImageUrl) {
        const updated = await this.memberRepo.update(member.id!, {
          profileImageUrl: latestProfileImageUrl,
          updatedAt: Timestamp.now(),
        });
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
    updateData: Partial<Pick<MemberData, "name" | "email" | "department" | "githubUsername">>
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

    return await this.memberRepo.update(memberId, updatePayload);
  }

  // 멤버 삭제
  async deleteMember(memberId: string): Promise<void> {
    await this.memberRepo.delete(memberId);
    logger.info("Member deleted", {id: memberId});
  }
}

