import { prisma } from '@/lib/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth, { type NextAuthOptions, type User as NextAuthUser } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

function buildProviders(): NextAuthOptions['providers'] {
  const providers: NextAuthOptions['providers'] = [];

  // 凭证登录（邮箱/用户名 + 密码）
  providers.push(
    CredentialsProvider({
      name: '凭证登录',
      id: 'credentials',
      credentials: {
        identifier: { label: '邮箱或用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.identifier || !credentials?.password) return null;
        const identifier = String(credentials.identifier).trim();
        const password = String(credentials.password);
        // 先按邮箱查找，失败再按用户名查找
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { name: identifier },
            ],
          },
        });
        if (!user || !user.password) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        const ret: NextAuthUser = { id: user.id, name: user.name ?? undefined, email: user.email ?? undefined, image: user.image ?? undefined };
        return ret;
      },
    })
  );

  // GitHub（仅在配置存在时启用）
  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(
      GitHubProvider({
        clientId: process.env.GITHUB_ID!,
        clientSecret: process.env.GITHUB_SECRET!,
      })
    );
  }

  // Google（仅在配置存在时启用）
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      })
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: buildProviders(),
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development', // 只在开发环境开启调试
  callbacks: {
    async jwt({ token, user }) {
      // 在首次登录时，将用户 id 放入 token.sub（NextAuth 默认行为）
      if (user) {
        const u = user as AdapterUser;
        token.sub = u.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        (session.user as { id?: string }).id = token.sub as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
