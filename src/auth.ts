import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { ensureDefaultAdmin } from "@/lib/db";
import { getAuthUserByEmail, getAuthSessionVersion, isSignupOpen } from "@/lib/auth-users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) {
          return null;
        }

        if (!isSignupOpen()) {
          await ensureDefaultAdmin();
        }

        const user = await getAuthUserByEmail(email);

        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.employeeName ?? user.email,
          role: user.role,
          employeeId: user.employeeId ? String(user.employeeId) : null,
          jobLevel: user.jobLevel,
          employeeName: user.employeeName,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sessionVersion = getAuthSessionVersion();
        if ("role" in user && typeof user.role === "string") {
          token.role = user.role;
        }
        if ("employeeId" in user && typeof user.employeeId === "string") {
          token.employeeId = user.employeeId;
        }
        if ("jobLevel" in user && typeof user.jobLevel === "string") {
          token.jobLevel = user.jobLevel;
        }
        if ("employeeName" in user && typeof user.employeeName === "string") {
          token.employeeName = user.employeeName;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = typeof token.role === "string" ? token.role : "";
        session.user.employeeId =
          typeof token.employeeId === "string" ? token.employeeId : null;
        session.user.jobLevel =
          typeof token.jobLevel === "string" ? token.jobLevel : null;
        session.user.employeeName =
          typeof token.employeeName === "string" ? token.employeeName : null;
      }
      session.sessionVersion =
        typeof token.sessionVersion === "string" ? token.sessionVersion : "";
      return session;
    },
  },
});
