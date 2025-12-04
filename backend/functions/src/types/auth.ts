export type Role = "USER" | "MEMBER" | "ADMIN";

export interface AccessTokenPayload {
  sub: string;          // userId (matches users/{id})
  roles: Role[];        // e.g., ["USER", "MEMBER"]
  memberId?: string;    // present only if linked to members/{id}
  iat: number;          // issued at
  exp: number;          // expiration time
  sid: string;          // sessionId (matches sessions/{sid})
}
