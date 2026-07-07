import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Resolve leaflet marker icon display issues in Vite bundlers.
// By default, bundlers compile asset paths in a way that breaks Leaflet's internal reference to marker images.
// To fix this, we create a custom Leaflet Icon using standard CDN assets and overwrite the Default Marker options.
const customIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

/**
 * Reusable MapComponent built using Leaflet and OpenStreetMap (100% free, open-source mapping).
 * This component takes a location text name, resolves it to mock geographic coordinates 
 * (to simulate geocoding), and renders a interactive tile map with a location pin.
 */
const MapComponent = ({ locationName }) => {
    const [position, setPosition] = React.useState([37.7749, -122.4194]); // Default: San Francisco, CA

    React.useEffect(() => {
        if (!locationName) return;

        const geocodeLocation = async () => {
            try {
                // 1. Try full search query first
                let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`);
                let results = await response.json();
                
                // 2. If no result, try splitting by comma and search for last two parts (e.g. city/state)
                if ((!results || results.length === 0) && locationName.includes(",")) {
                    const parts = locationName.split(",").map(p => p.trim()).filter(Boolean);
                    if (parts.length > 1) {
                        const simplified = parts.slice(-2).join(", ");
                        response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simplified)}&limit=1`);
                        results = await response.json();
                    }
                }
                
                // 3. If still no result, search for the last 2 space-separated words (e.g. "Kolkata 743144")
                if (!results || results.length === 0) {
                    const tokens = locationName.split(/\s+/).map(t => t.trim()).filter(Boolean);
                    if (tokens.length > 1) {
                        const simplified = tokens.slice(-2).join(" ");
                        response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simplified)}&limit=1`);
                        results = await response.json();
                    }
                }
                
                // 4. If still no result, search for just the single last word (e.g. "Kolkata" or zipcode)
                if (!results || results.length === 0) {
                    const tokens = locationName.split(/\s+/).map(t => t.trim()).filter(Boolean);
                    if (tokens.length > 0) {
                        const lastToken = tokens[tokens.length - 1];
                        response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lastToken)}&limit=1`);
                        results = await response.json();
                    }
                }

                if (results && results.length > 0) {
                    const lat = parseFloat(results[0].lat);
                    const lon = parseFloat(results[0].lon);
                    setPosition([lat, lon]);
                } else {
                    // Fail-safe static geocoder checks
                    const query = locationName.toLowerCase();
                    if (query.includes("beach") || query.includes("marina")) {
                        setPosition([13.0480, 80.2824]);
                    } else if (query.includes("seattle") || query.includes("drive")) {
                        setPosition([47.6062, -122.3321]);
                    } else if (query.includes("francisco")) {
                        setPosition([37.7749, -122.4194]);
                    } else if (query.includes("chicago")) {
                        setPosition([41.8781, -87.6298]);
                    } else if (query.includes("austin")) {
                        setPosition([30.2672, -97.7431]);
                    }
                }
            } catch (error) {
                console.error("OSM Geocoding failed:", error);
            }
        };

        geocodeLocation();
    }, [locationName]);

    return (
        <div className="w-full h-full relative border border-slate-200 rounded-xl overflow-hidden shadow-inner">
            {/* 
              MapContainer: Primary Leaflet element initializing the map engine.
              - key: Formed from position to force clean re-mounts when coordinates update.
            */}
            <MapContainer 
                key={`${position[0]}-${position[1]}`}
                center={position} 
                zoom={13} 
                scrollWheelZoom={false}
                style={{ width: "100%", height: "100%" }}
            >
                {/* 
                  TileLayer: Renders maps graphics on the screen.
                  We use OpenStreetMap public tile server which provides beautiful, open layouts for free.
                */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* 
                  Marker: Draws the geographic pin on the map.
                  We supply our resolved customIcon to avoid Vite asset path errors.
                */}
                <Marker position={position} icon={customIcon}>
                    {/* Popup: Interactive speech bubble displaying location metadata when marker is clicked. */}
                    <Popup>
                        <div className="text-xs font-semibold">
                            <p className="text-[#004ac6] font-bold">{locationName || "Event Location"}</p>
                            <p className="text-slate-500 font-medium mt-1">Coordinates: {position[0]}, {position[1]}</p>
                            <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationName)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#004ac6] hover:underline font-bold mt-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[14px]">directions</span>
                                <span>Get Directions</span>
                            </a>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapComponent;
