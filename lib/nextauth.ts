import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  debug: true, // Enables detailed Netlify function logs for auth steps
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        const googleProfile = profile as {
          email_verified?: boolean;
          email?: string;
          sub?: string;
          name?: string;
          picture?: string;
        };

        if (!googleProfile?.email_verified || !googleProfile.email || !googleProfile.sub) {
          return false;
        }

        const email = googleProfile.email.toLowerCase().trim();
        const googleId = googleProfile.sub;
        const name = googleProfile.name || email.split('@')[0];
        const image = googleProfile.picture;

        try {
          await prisma.$transaction(async (tx) => {
            let user = await tx.user.findFirst({
              where: { OR: [{ googleId }, { email }] },
              include: { character: true },
            });

            if (!user) {
              await tx.user.create({
                data: {
                  email,
                  googleId,
                  name,
                  image,
                  timezone: 'Asia/Kolkata',
                  character: { create: { overallStreak: 0 } },
                },
              });
            } else {
              await tx.user.update({
                where: { id: user.id },
                data: { googleId, name: user.name || name, image: user.image || image },
              });
              if (!user.character) {
                await tx.character.create({ data: { userId: user.id, overallStreak: 0 } });
              }
            }
          });
          return true;
        } catch (error) {
          console.error('[NEXTAUTH_DATABASE_ERROR]', error);
          return false;
        }
      }
      return false;
    },

    async jwt({ token, account, profile }) {
      if (account && profile) {
        const email = (profile.email || token.email)?.toLowerCase().trim();
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            include: { character: true },
          });
          if (dbUser) {
            token.userId = dbUser.id;
            token.characterId = dbUser.character?.id;
            token.email = dbUser.email;
          }
        }
      }

      if (!token.userId && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: (token.email as string).toLowerCase().trim() },
          include: { character: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.characterId = dbUser.character?.id;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).characterId = token.characterId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
