/* eslint-disable @typescript-eslint/no-explicit-any */
    import { prisma } from "@/lib/prisma";
    import pusher from "@/lib/pusher";

    export async function notifyNearbyAgents(delivery: any) {
    try {
        const nearbyAgents = await prisma.user.findMany({
        where: {
            role: "AGENT",
            verificationStatus: "APPROVED",
            //after adding google place api i will work on tat
            // For now, we'll notify all approved agents
        },
        });

        // Send notifications to nearby agents
        const notifyPromises = nearbyAgents.map((agent) =>
        sendNotification(agent.id, {
            title: "New Delivery Request",
            body: `A new delivery is available near your location`,
            data: { deliveryId: delivery.id },
        })
        );

        await Promise.allSettled(notifyPromises);
        
        await pusher.trigger("agent-updates", "new-delivery", {
        deliveryId: delivery.id,
        pickup: delivery.pickup,
        price: delivery.price,
        });
    } catch (error) {
        console.error("Error notifying nearby agents:", error);
    }
    }

    export async function sendNotification(
    userId: string,
    payload: { title: string; body: string; icon?: string; data?: any }
    ) {
    try {
        const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
        });

        if (subscriptions.length === 0) return;

        const sendPromises = subscriptions.map((subscription) =>
        fetch("/api/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            subscription,
            payload,
            }),
        })
        );

        await Promise.allSettled(sendPromises);
    } catch (error) {
        console.error("Push notification error:", error);
    }
    }

    export async function savePushSubscription(
    userId: string,
    subscription: any
    ) {
    try {
        await prisma.pushSubscription.create({
        data: {
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        },
        });
    } catch (error) {
        console.error("Error saving push subscription:", error);
        throw error;
    }
    }