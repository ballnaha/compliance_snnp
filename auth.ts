import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                const { prisma } = await import("@/lib/prisma");

                const user = await prisma.users.findUnique({
                    where: { username: credentials.username as string },
                });

                if (!user || !user.password) return null;

                // Check password - assuming it's hashed in the DB
                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordCorrect) return null;

                const userFactories = await prisma.users_factory.findMany({
                    where: { user_id: Number(user.id) }
                });
                const factoryNames = userFactories.map(f => f.factory_name).filter(Boolean).join(',');

                return {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    cat_id: user.cat_id,
                    factories: factoryNames,
                };
            },
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLoginPage = nextUrl.pathname.startsWith("/login");

            if (!isLoggedIn && !isOnLoginPage) {
                return false; // Redirect to login
            }
            if (isLoggedIn && isOnLoginPage) {
                return Response.redirect(new URL("/", nextUrl));
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.department = (user as any).department;
                token.cat_id = (user as any).cat_id;
                token.factories = (user as any).factories;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.sub;
                (session.user as any).role = token.role;
                (session.user as any).department = token.department;
                (session.user as any).cat_id = token.cat_id;
                (session.user as any).factories = token.factories;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});
