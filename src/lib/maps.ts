/* eslint-disable @typescript-eslint/no-explicit-any */
    import { Loader } from "@googlemaps/js-api-loader";

    const loader = new Loader({
    apiKey: process.env.GOOGLE_MAPS_API_KEY!,
    version: "weekly",
    libraries: ["geometry"], 
    });

    export const calculateDistance = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
    ): Promise<{ distance: number; duration: number }> => {
    try {
        const { DistanceMatrixService } = await loader.importLibrary("routes");
        
        const service = new DistanceMatrixService();
        
        return new Promise((resolve, reject) => {
        service.getDistanceMatrix(
            {
            origins: [origin],
            destinations: [destination],
            travelMode: "DRIVING",
            },
            (response: { rows: { elements: {
                status: string;
                distance: any; duration: { value: any; }; 
}[]; }[]; }, status: string) => {
            if (status === "OK" && response.rows[0].elements[0].status === "OK") {
                const distance = response.rows[0].elements[0].distance.value; // meters
                const duration = response.rows[0].elements[0].duration.value; // seconds
                resolve({ distance: distance / 1000, duration: duration / 60 });
            } else {
                reject(status || "No results found");
            }
            }
        );
        });
    } catch (error) {
        console.error("Error calculating distance:", error);
        throw error;
    }
    };

