import type { NextAuthConfig } from "next-auth";

// Config compartilhada, sem dependências Node (segura para Edge / middleware).
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.isAdmin = (user as any).isAdmin;
        token.tenantIds = (user as any).tenantIds ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin;
        (session.user as any).tenantIds = token.tenantIds;
      }
      return session;
    },
  },
};
