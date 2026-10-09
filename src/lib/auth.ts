import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID || "",
            clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user || !user.password || !user.isActive) {
                    return null
                }

                const isValid = await bcrypt.compare(credentials.password, user.password)

                if (!isValid) {
                    return null
                }

                // Remove image to prevent large session cookies
                const { image, password, ...userWithoutSensitiveData } = user;
                return userWithoutSensitiveData as any;
            }
        })
    ],
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async signIn({ user }) {
            if (!user.email) return false;

            const existingUser = await prisma.user.findUnique({
                where: { email: user.email },
                select: { isActive: true },
            });

            return existingUser ? existingUser.isActive : true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.permissions = (user as any).permissions
                token.createdById = (user as any).createdById
                token.phone = (user as any).phone
                // Explicitly exclude image to prevent large cookie size
                token.picture = undefined
            }
            if (trigger === "update" && session) {
                if (session.permissions) token.permissions = session.permissions;
                if (session.phone) token.phone = session.phone;
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).permissions = token.permissions;
                (session.user as any).createdById = token.createdById;
                (session.user as any).phone = token.phone;
                // Never include image in session to prevent cookie overflow
                if (session.user.image) delete session.user.image;
            }
            return session
        }
    },
    pages: {
        signIn: "/auth/signin",
    },
    debug: process.env.NODE_ENV === "development",
};
