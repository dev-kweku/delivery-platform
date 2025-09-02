    // types/next-auth.d.ts
    import { DefaultSession, DefaultUser } from "next-auth";
    import { Role } from "@prisma/client";

    declare module "next-auth" {
    /**
     * Extends the built-in user types
     */
    interface User extends DefaultUser {
        role: Role;
    }

    /**
     * Extends the session to include custom fields
     */
    interface Session {
        user: {
        id: string;
        role: Role;
        } & DefaultSession["user"];
    }
    }

    declare module "next-auth/jwt" {
    /**
     * Extends the JWT to include custom fields
     */
    interface JWT {
        role: Role;
        sub?: string;
    }
    }