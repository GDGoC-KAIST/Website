import {Timestamp} from "firebase-admin/firestore";
import {UserData, UserStatus} from "../types/user";
import {UserRepository} from "../repositories/userRepository";
import {sendEmail} from "../utils/email";
import * as logger from "firebase-functions/logger";

// 비즈니스 로직 레이어
export class AdminService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  // 관리자 권한 확인
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    return user?.isAdmin === true || false;
  }

  // 승인 대기 중인 사용자 목록 조회
  async getPendingUsers(limit: number = 50, offset: number = 0): Promise<{
    users: UserData[];
    total: number;
  }> {
    const users = await this.userRepo.findPendingUsers(limit, offset);
    return {
      users,
      total: users.length,
    };
  }

  // 사용자 승인
  async approveUser(userId: string, adminId: string): Promise<UserData> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.status === UserStatus.APPROVED) {
      throw new Error("User already approved");
    }

    const updated = await this.userRepo.update(userId, {
      status: UserStatus.APPROVED,
      approvedAt: Timestamp.now(),
      approvedBy: adminId,
      updatedAt: Timestamp.now(),
    });

    logger.info("User approved", {userId, adminId});

    // 승인 완료 이메일 발송
    try {
      await this.sendApprovalEmail(updated, true);
    } catch (error) {
      logger.error("Failed to send approval email", error);
      // 이메일 발송 실패해도 승인은 성공으로 처리
    }

    return updated;
  }

  // 사용자 거부
  async rejectUser(userId: string, adminId: string): Promise<UserData> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const updated = await this.userRepo.update(userId, {
      status: UserStatus.REJECTED,
      approvedBy: adminId,
      updatedAt: Timestamp.now(),
    });

    logger.info("User rejected", {userId, adminId});

    // 거부 완료 이메일 발송
    try {
      await this.sendApprovalEmail(updated, false);
    } catch (error) {
      logger.error("Failed to send rejection email", error);
      // 이메일 발송 실패해도 거부는 성공으로 처리
    }

    return updated;
  }

  // 관리자 권한 부여
  async grantAdmin(userId: string, adminId: string): Promise<UserData> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const updated = await this.userRepo.update(userId, {
      isAdmin: true,
      updatedAt: Timestamp.now(),
    });

    logger.info("Admin granted", {userId, adminId});

    return updated;
  }

  // 승인/거부 결과 이메일 발송
  private async sendApprovalEmail(user: UserData, approved: boolean): Promise<void> {
    if (!user.email) {
      logger.warn("User email not found, cannot send approval email", {userId: user.id});
      return;
    }

    const subject = approved ?
      "[GDGoC] 가입 승인 완료" :
      "[GDGoC] 가입 요청 거부";

    const html = approved ? `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>가입 승인 완료</h1>
          </div>
          <div class="content">
            <p>안녕하세요, ${user.name}님!</p>
            <p>GDGoC 웹사이트 가입 요청이 승인되었습니다.</p>
            <p>이제 로그인하여 서비스를 이용하실 수 있습니다.</p>
          </div>
          <div class="footer">
            <p>이 이메일은 자동으로 발송되었습니다.</p>
          </div>
        </div>
      </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>가입 요청 거부</h1>
          </div>
          <div class="content">
            <p>안녕하세요, ${user.name}님!</p>
            <p>죄송하지만 GDGoC 웹사이트 가입 요청이 거부되었습니다.</p>
            <p>추가 문의사항이 있으시면 관리자에게 연락해주세요.</p>
          </div>
          <div class="footer">
            <p>이 이메일은 자동으로 발송되었습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = approved ?
      `안녕하세요, ${user.name}님!\n\nGDGoC 웹사이트 가입 요청이 승인되었습니다.\n이제 로그인하여 서비스를 이용하실 수 있습니다.` :
      `안녕하세요, ${user.name}님!\n\n죄송하지만 GDGoC 웹사이트 가입 요청이 거부되었습니다.\n추가 문의사항이 있으시면 관리자에게 연락해주세요.`;

    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  }
}

