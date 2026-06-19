import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    sessionVersion?: string;
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      employeeId: string | null;
      jobLevel: string | null;
      employeeName: string | null;
    };
  }

  interface User extends DefaultUser {
    role: string;
    employeeId?: string | null;
    jobLevel?: string | null;
    employeeName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    sessionVersion?: string;
    employeeId?: string;
    jobLevel?: string;
    employeeName?: string;
  }
}
