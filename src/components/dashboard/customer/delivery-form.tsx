/* eslint-disable @typescript-eslint/no-explicit-any */
    // src/components/dashboard/customer/delivery-form.tsx
    "use client";

    import { useState } from "react";
    import { useForm } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { z } from "zod";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Textarea } from "@/components/ui/textarea";
    import { Label } from "@/components/ui/label";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { useToast } from "@/components/ui/use-toast";
    import { createDelivery } from "@/lib/delivery-service";
    import { useAuth } from "@/hooks/use-auth";

    const schema = z.object({
    pickupAddress: z.string().min(1, "Pickup address is required"),
    dropoffAddress: z.string().min(1, "Drop-off address is required"),
    itemDescription: z.string().min(1, "Item description is required"),
    itemWeight: z.number().min(0.1, "Weight must be greater than 0").optional(),
    itemValue: z.number().min(0, "Value must be non-negative").optional(),
    });

    type FormData = z.infer<typeof schema>;

    export function DeliveryForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
    });
    const { toast } = useToast();
    const { user } = useAuth();

    const onSubmit = async (data: FormData) => {
        if (!user) {
        toast({
            title: "Authentication Required",
            description: "Please sign in to create a delivery request",
            variant: "destructive",
        });
        return;
        }

        setIsSubmitting(true);
        
        try {
        // Create delivery request
        const delivery = await createDelivery(user.id, {
            pickupAddress: data.pickupAddress,
            dropoffAddress: data.dropoffAddress,
            itemDetails: {
            description: data.itemDescription,
            weight: data.itemWeight,
            value: data.itemValue,
            },
        });

        // Show success toast
        toast({
            title: "Delivery Created",
            description: `Your delivery request has been created successfully. ID: ${delivery.id.slice(-6)}`,
        });

        // Reset form
        reset();
        } catch (error: any) {
        // Show error toast
        toast({
            title: "Error",
            description: error.message || "Failed to create delivery request",
            variant: "destructive",
        });
        } finally {
        setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Create New Delivery Request</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="pickupAddress">Pickup Address</Label>
                <Input
                id="pickupAddress"
                {...register("pickupAddress")}
                placeholder="Enter pickup location"
                className="w-full"
                />
                {errors.pickupAddress && (
                <p className="text-sm text-red-500">{errors.pickupAddress.message}</p>
                )}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="dropoffAddress">Drop-off Address</Label>
                <Input
                id="dropoffAddress"
                {...register("dropoffAddress")}
                placeholder="Enter drop-off location"
                className="w-full"
                />
                {errors.dropoffAddress && (
                <p className="text-sm text-red-500">{errors.dropoffAddress.message}</p>
                )}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="itemDescription">Item Description</Label>
                <Textarea
                id="itemDescription"
                {...register("itemDescription")}
                placeholder="Describe the item being delivered"
                className="w-full min-h-[100px]"
                />
                {errors.itemDescription && (
                <p className="text-sm text-red-500">{errors.itemDescription.message}</p>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="itemWeight">Weight (kg) - Optional</Label>
                <Input
                    id="itemWeight"
                    type="number"
                    step="0.1"
                    {...register("itemWeight", { valueAsNumber: true })}
                    placeholder="e.g., 2.5"
                    className="w-full"
                />
                {errors.itemWeight && (
                    <p className="text-sm text-red-500">{errors.itemWeight.message}</p>
                )}
                </div>
                
                <div className="space-y-2">
                <Label htmlFor="itemValue">Value (GHS) - Optional</Label>
                <Input
                    id="itemValue"
                    type="number"
                    {...register("itemValue", { valueAsNumber: true })}
                    placeholder="e.g., 500"
                    className="w-full"
                />
                {errors.itemValue && (
                    <p className="text-sm text-red-500">{errors.itemValue.message}</p>
                )}
                </div>
            </div>
            
            <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full"
            >
                {isSubmitting ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                </>
                ) : (
                "Create Delivery Request"
                )}
            </Button>
            </form>
        </CardContent>
        </Card>
    );
    }