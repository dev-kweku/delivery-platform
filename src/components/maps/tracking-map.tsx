    "use client";

    import { useEffect, useRef, useState } from "react";
    import { Loader } from "@googlemaps/js-api-loader";

    interface TrackingMapProps {
    pickup: { lat: number; lng: number };
    dropoff: { lat: number; lng: number };
    agentLocation?: { lat: number; lng: number };
    }

    export function TrackingMap({ pickup, dropoff, agentLocation }: TrackingMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (!mapRef.current || mapLoaded) return;

        const initializeMap = async () => {
        if (!mapRef.current) {
            console.error("Map container element not found");
            return;
        }

        const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
            version: "weekly",
            libraries: ["routes"],
        });

        try {
            const { Map } = await loader.importLibrary("maps");
            const { DirectionsService, DirectionsRenderer } = await loader.importLibrary("routes");

            const map = new Map(mapRef.current as HTMLElement, {
            center: { lat: pickup.lat, lng: pickup.lng },
            zoom: 14,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            });

            mapInstanceRef.current = map;

            const directionsRenderer = new DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: "#4285F4",
                strokeWeight: 5,
            },
            });
            directionsRendererRef.current = directionsRenderer;

            new google.maps.Marker({
            position: pickup,
            map,
            icon: {
                url: "/images/pickup-marker.png",
                scaledSize: new google.maps.Size(40, 40),
            },
            title: "Pickup Location",
            });

            new google.maps.Marker({
            position: dropoff,
            map,
            icon: {
                url: "/images/dropoff-marker.png",
                scaledSize: new google.maps.Size(40, 40),
            },
            title: "Dropoff Location",
            });

            const directionsService = new DirectionsService();
            directionsService.route(
            {
                origin: pickup,
                destination: dropoff,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === "OK" && result) {
                directionsRenderer.setDirections(result);
                setMapLoaded(true);
                } else {
                console.error("Directions request failed due to " + status);
                }
            }
            );
        } catch (error) {
            console.error("Error initializing map:", error);
        }
        };

        initializeMap();
    }, [pickup, dropoff, mapLoaded]);

    useEffect(() => {
        if (!agentLocation || !mapInstanceRef.current || !mapLoaded) return;

        try {

        new google.maps.Marker({
            position: agentLocation,
            map: mapInstanceRef.current,
            icon: {
            url: "/images/agent-marker.png",
            scaledSize: new google.maps.Size(30, 30),
            },
            title: "Delivery Agent",
        });

        if (directionsRendererRef.current) {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route(
            {
                origin: agentLocation,
                destination: dropoff,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === "OK" && result) {
                directionsRendererRef.current?.setDirections(result);
                } else {
                console.error("Directions request failed due to " + status);
                }
            }
            );
        }
        } catch (error) {
        console.error("Error updating agent location:", error);
        }
    }, [agentLocation, dropoff, mapLoaded]);

    return <div ref={mapRef} className="w-full h-96 rounded-lg" />;
    }