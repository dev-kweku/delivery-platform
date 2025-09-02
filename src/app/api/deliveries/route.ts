    import { NextResponse } from "next/server";
    import { getServerSession } from "next-auth";
    import { authOptions } from "@/lib/auth";
    import { prisma } from "@/lib/prisma";
    import { calculateDistance, calculatePrice } from "@/lib/maps"; 

    export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { pickup, dropoff, itemDetails } = await request.json();
        
        const distanceResult = await calculateDistance(pickup, dropoff);
        const distance = distanceResult.distance; 
        const duration = distanceResult.duration; 
        const price = calculatePrice(distance, itemDetails); 
        
        const delivery = await prisma.delivery.create({
        data: {
            customerId: session.user.id,
            pickup,
            dropoff,
            itemDetails,
            distance, 
            price,
            estimatedTime: Math.round(duration), 
        },
        });
        
        return NextResponse.json(delivery);
    } catch (error) {
        console.error("Error creating delivery:", error);
        return NextResponse.json(
        { error: "Failed to create delivery" },
        { status: 500 }
        );
    }
    }