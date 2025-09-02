/* eslint-disable @typescript-eslint/no-unused-vars */
    import { prisma } from "@/lib/prisma";
    import { calculateDistance, calculatePrice,geocodeAddress } from "@/lib/maps";
    import { notifyNearbyAgents } from "@/lib/notification-service";

export interface DeliveryRequest {
    pickupAddress: string;
    dropoffAddress: string;
    itemDetails: {
        description: string;
        weight?: number;
        value?: number;
        };
    }

export async function createDelivery(
    userId: string,
    deliveryRequest: DeliveryRequest
    ) {
        try {
        let pickupCoords;
        try {
            pickupCoords = await geocodeAddress(deliveryRequest.pickupAddress);
        } catch (error) {
            throw new Error(`Could not find pickup address: ${deliveryRequest.pickupAddress}. Please enter a valid address.`);
        }
    
        let dropoffCoords;
        try {
            dropoffCoords = await geocodeAddress(deliveryRequest.dropoffAddress);
        } catch (error) {
            throw new Error(`Could not find drop-off address: ${deliveryRequest.dropoffAddress}. Please enter a valid address.`);
        }
        
        // Calculate distance and price
        const distanceResult = await calculateDistance(pickupCoords, dropoffCoords);
        const price = calculatePrice(distanceResult.distance, deliveryRequest.itemDetails);
        
        // Create the delivery in the database
        const delivery = await prisma.delivery.create({
            data: {
            customerId: userId,
            pickup: {
                address: deliveryRequest.pickupAddress,
                lat: pickupCoords.lat,
                lng: pickupCoords.lng,
            },
            dropoff: {
                address: deliveryRequest.dropoffAddress,
                lat: dropoffCoords.lat,
                lng: dropoffCoords.lng,
            },
            itemDetails: deliveryRequest.itemDetails,
            distance: distanceResult.distance,
            price,
            estimatedTime: Math.round(distanceResult.duration),
            status: "PENDING",
            },
        });
        
        // Notify nearby agents about the new delivery request
        await notifyNearbyAgents(delivery);
        
        return delivery;
        } catch (error) {
        console.error("Error creating delivery:", error);
        throw error;
        }
    }

    export async function getUserDeliveries(userId: string) {
    try {
        const deliveries = await prisma.delivery.findMany({
        where: {
            customerId: userId,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            agent: {
            select: {
                id: true,
                name: true,
                phone: true,
                averageRating: true,
            },
            },
        },
        });
        
        return deliveries;
    } catch (error) {
        console.error("Error fetching user deliveries:", error);
        throw new Error("Failed to fetch deliveries");
    }
    }

    export async function getDeliveryDetails(deliveryId: string) {
    try {
        const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
            customer: {
            select: {
                id: true,
                name: true,
                phone: true,
            },
            },
            agent: {
            select: {
                id: true,
                name: true,
                phone: true,
                averageRating: true,
            },
            },
        },
        });
        
        if (!delivery) {
        throw new Error("Delivery not found");
        }
        
        return delivery;
    } catch (error) {
        console.error("Error fetching delivery details:", error);
        throw new Error("Failed to fetch delivery details");
    }
    }

    export async function cancelDelivery(deliveryId: string, userId: string) {
    try {
        const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        });
        
        if (!delivery) {
        throw new Error("Delivery not found");
        }
        
        if (delivery.customerId !== userId) {
        throw new Error("Unauthorized to cancel this delivery");
        }
        
        if (delivery.status !== "PENDING") {
        throw new Error("Cannot cancel delivery in current status");
        }
        
        const updatedDelivery = await prisma.delivery.update({
        where: { id: deliveryId },
        data: { status: "CANCELLED" },
        });
        
        return updatedDelivery;
    } catch (error) {
        console.error("Error cancelling delivery:", error);
        throw error;
    }
    }