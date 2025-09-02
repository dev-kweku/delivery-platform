    import NextAuth, { type NextAuthOptions } from "next-auth";
    import { PrismaAdapter } from "@next-auth/prisma-adapter";
    import GoogleProvider from "next-auth/providers/google";
    import EmailProvider from "next-auth/providers/email";
    import CredentialsProvider from "next-auth/providers/credentials";
    import { JWT } from "next-auth/jwt";
    import { User } from "next-auth";
    import { Session } from "next-auth";
    import { prisma } from "@/lib/prisma";
    import { Role } from "@prisma/client";
    import { verifyOTP } from "./sms-service";

    export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        EmailProvider({
        server: {
            host: process.env.EMAIL_SERVER_HOST,
            port: process.env.EMAIL_SERVER_PORT,
            auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
            },
        },
        from: process.env.EMAIL_FROM,
        }),
        CredentialsProvider({
        id: "phone-otp",
        name: "Phone OTP",
        credentials: {
            phone: { label: "Phone Number", type: "text" },
            otp: { label: "OTP", type: "text" },
        },
        async authorize(credentials) {
            if (!credentials?.phone || !credentials?.otp) return null;
            
            const isValid = await verifyOTP(credentials.phone, credentials.otp);
            if (!isValid) return null;
            
            let user = await prisma.user.findUnique({
            where: { phone: credentials.phone },
            });
            
            if (!user) {
            user = await prisma.user.create({
                data: {
                phone: credentials.phone,
                name: `User-${credentials.phone.slice(-4)}`,
                role: Role.CUSTOMER,
                },
            });
            }
            
            return { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
            };
        },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }: { token: JWT; user?: User }) {
        if (user) {
            token.role = user.role;
        }
        return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
        if (session.user && token) {
            session.user.id = token.sub!;
            session.user.role = token.role;
        }
        return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
        signOut: "/auth/signout",
        error: "/auth/error",
    },
    };


    const handler = NextAuth(authOptions);

    export { handler as GET, handler as POST };