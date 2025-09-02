    // src/lib/admin-service.ts
    import { prisma } from "@/lib/prisma";

    export interface AdminStats {
    totalUsers: number;
    totalDeliveries: number;
    totalRevenue: number;
    activeDeliveries: number;
    pendingVerifications: number;
    }

    export async function getAdminStats(): Promise<AdminStats> {
    try {
        // Get total users count
        const totalUsers = await prisma.user.count();
        
        // Get total deliveries count
        const totalDeliveries = await prisma.delivery.count();
        
        // Get total revenue from completed payments
        const revenueResult = await prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
        });
        const totalRevenue = revenueResult._sum.amount || 0;
        
        // Get active deliveries (not delivered or cancelled)
        const activeDeliveries = await prisma.delivery.count({
        where: {
            status: {
            in: ["PENDING", "ACCEPTED", "IN_TRANSIT", "PAID"],
            },
        },
        });
        
        // Get pending agent verifications
        const pendingVerifications = await prisma.user.count({
        where: {
            role: "AGENT",
            verificationStatus: "PENDING",
        },
        });
        
        return {
        totalUsers,
        totalDeliveries,
        totalRevenue,
        activeDeliveries,
        pendingVerifications,
        };
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw new Error("Failed to fetch admin statistics");
    }
    }

    export async function getRecentDeliveries(limit: number = 10) {
    try {
        const deliveries = await prisma.delivery.findMany({
        take: limit,
        orderBy: {
            createdAt: "desc",
        },
        include: {
            customer: {
            select: {
                id: true,
                name: true,
            },
            },
            agent: {
            select: {
                id: true,
                name: true,
            },
            },
        },
        });
        
        return deliveries;
    } catch (error) {
        console.error("Error fetching recent deliveries:", error);
        throw new Error("Failed to fetch recent deliveries");
    }
    }

    export async function getRecentUsers(limit: number = 10) {
    try {
        const users = await prisma.user.findMany({
        take: limit,
        orderBy: {
            createdAt: "desc",
        },
        });
        
        return users;
    } catch (error) {
        console.error("Error fetching recent users:", error);
        throw new Error("Failed to fetch recent users");
    }
    }

    export async function getRevenueData(period: "day" | "week" | "month" | "year" = "month") {
    try {
        let startDate: Date;
        const now = new Date();
        
        switch (period) {
        case "day":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case "week":
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case "year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }
        
        const payments = await prisma.payment.findMany({
        where: {
            status: "COMPLETED",
            createdAt: {
            gte: startDate,
            },
        },
        orderBy: {
            createdAt: "asc",
        },
        });
        
        // Group by day
        const groupedData: Record<string, { date: string; revenue: number; deliveries: number }> = {};
        
        payments.forEach((payment) => {
        const date = payment.createdAt.toISOString().split("T")[0];
        
        if (!groupedData[date]) {
            groupedData[date] = { date, revenue: 0, deliveries: 0 };
        }
        
        groupedData[date].revenue += payment.amount;
        groupedData[date].deliveries += 1;
        });
        
        return Object.values(groupedData);
    } catch (error) {
        console.error("Error fetching revenue data:", error);
        throw new Error("Failed to fetch revenue data");
    }
    }

    export async function getTopAgents(limit: number = 5) {
    try {
        const agents = await prisma.user.findMany({
        where: {
            role: "AGENT",
        },
        include: {
            _count: {
            select: {
                deliveriesAccepted: true,
            },
            },
        },
        orderBy: {
            deliveriesAccepted: {
            _count: "desc",
            },
        },
        take: limit,
        });
        
        return agents;
    } catch (error) {
        console.error("Error fetching top agents:", error);
        throw new Error("Failed to fetch top agents");
    }
    }

    export async function getCommissionReport(period: "day" | "week" | "month" | "year" = "month") {
    try {
        let startDate: Date;
        const now = new Date();
        
        switch (period) {
        case "day":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case "week":
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case "year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }
        
        const commissions = await prisma.commission.findMany({
        where: {
            createdAt: {
            gte: startDate,
            },
        },
        include: {
            payment: {
            include: {
                delivery: {
                include: {
                    customer: true,
                    agent: true,
                },
                },
            },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        });
        
        // Calculate total commission
        const totalCommission = commissions.reduce(
        (sum, commission) => sum + commission.amount,
        0
        );
        
        // Format the response
        const formattedCommissions = commissions.map((commission) => ({
        id: commission.id,
        paymentId: commission.paymentId,
        deliveryId: commission.payment.deliveryId,
        amount: commission.amount,
        rate: commission.rate,
        createdAt: commission.createdAt.toISOString(),
        customer: commission.payment.delivery.customer,
        agent: commission.payment.delivery.agent,
        }));
        
        return {
        commissions: formattedCommissions,
        total: totalCommission,
        };
    } catch (error) {
        console.error("Error fetching commission report:", error);
        throw new Error("Failed to fetch commission report");
    }
    }