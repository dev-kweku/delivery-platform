    import CredentialsProvider from "next-auth/providers/credentials";
    import { verifyOTP } from "@/lib/sms-service";
    import { prisma } from "./prisma";
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
            role: "CUSTOMER", 
            },
        });
        }
        
        return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
    });