import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from './db';
import bcrypt from 'bcryptjs';

const isProd = process.env.NODE_ENV === 'production';

// Only pin the cookie to a shared parent domain when a real custom domain is
// configured (enables SSO across cafe subdomains like haku.regulr.in). On a
// plain host (e.g. *.vercel.app) leave it undefined so the browser scopes the
// cookie to the actual host — otherwise the session cookie is silently dropped
// and every login bounces back to the landing page.
const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
const cookieDomain =
  rootDomain && rootDomain !== 'localhost' && rootDomain.includes('.')
    ? `.${rootDomain}`
    : !isProd
      ? '.localhost'
      : undefined;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const sessionUser = session.user as { id?: unknown; role?: unknown };
        sessionUser.id = token.id;
        sessionUser.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        secure: isProd,
      },
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET || 'regulr-dev-secret-change-in-prod',
};
