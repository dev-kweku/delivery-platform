    import { cacheGet, cacheSet } from "@/lib/cache";
    import {Loader} from "@googlemaps/js-api-loader"

const loader=new Loader({
    apiKey:process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    version:"weekly",
    libraries:["places","geometry"],
})


export const initializeMap=async (container:HTMLElement,options:google.maps.MapOptions)=>{
    await loader.load();
    return new google.maps.Map(container, options);
}


export const calculateRoute = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
    ): Promise<google.maps.DirectionsResult> => {
        const { DirectionsService } = await loader.importLibrary("routes");
        const directionsService = new DirectionsService();
    
        return new Promise((resolve, reject) => {
        directionsService.route(
            {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
            if (status === "OK" && result) {
                resolve(result);
            } else {
                reject(new Error(`Directions request failed due to ${status}`));
            }
            }
        );
        });
    };


    export const calculateDistance = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
    ): Promise<{ distance: number; duration: number }> => {
    const cacheKey = `distance:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;
    
    const cached = cacheGet<{ distance: number; duration: number }>(cacheKey);
    if (cached && typeof cached.distance === 'number' && typeof cached.duration === 'number') {
        return cached;
    }
    
    try {
        const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        `origins=${origin.lat},${origin.lng}&` +
        `destinations=${destination.lat},${destination.lng}&` +
        `key=${process.env.GOOGLE_MAPS_API_KEY}&` +
        `units=metric`
        );
        
        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === "OK" && data.rows[0].elements[0].status === "OK") {
        const distance = data.rows[0].elements[0].distance.value; // meters
        const duration = data.rows[0].elements[0].duration.value; // seconds
        const result = { distance: distance / 1000, duration: duration / 60 };
        
    
        cacheSet(cacheKey, result, 60 * 60);
        
        return result;
        } else {
        const errorMessage = data.error_message || data.rows[0].elements[0].status || "Unknown error";
        throw new Error(`Failed to calculate distance: ${errorMessage}`);
        }
    } catch (error) {
        console.error("Error calculating distance:", error);
        throw error;
    }
    };

    export const calculatePrice = (
    distance: number,
    itemDetails: { weight?: number; value?: number } = {}
    ): number => {
    let price = 10;
    
    price += distance * 2.5;
    
    if (itemDetails.weight && itemDetails.weight > 5) {
        price += (itemDetails.weight - 5) * 1.5;
    }
    
    if (itemDetails.value && itemDetails.value > 500) {
        price += itemDetails.value * 0.02; // 2% insurance
    }
    
    return Math.ceil(price * 2) / 2;
    };



export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
    try {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(address)}&` +
        `key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === "OK" && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        } else {
            throw new Error(`Geocoding failed for address: ${address}`);
        }
        } catch (error) {
        console.error("Error geocoding address:", error);
        throw error;
        }
    };


    