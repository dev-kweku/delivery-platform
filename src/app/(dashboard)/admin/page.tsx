    // src/app/(dashboard)/admin/page.tsx
    "use client";

    import { useEffect, useState } from "react";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { getAdminStats } from "@/lib/admin-service";

    interface Stats {
    totalUsers: number;
    totalDeliveries: number;
    totalRevenue: number;
    activeDeliveries: number;
    }

    export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalDeliveries: 0,
        totalRevenue: 0,
        activeDeliveries: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
        const data = await getAdminStats();
        setStats(data);
        };
        fetchStats();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
            <CardHeader>
            <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </CardContent>
        </Card>
        
        {/* Other stat cards */}
        </div>
    );
    }