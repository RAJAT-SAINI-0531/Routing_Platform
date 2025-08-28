"""
Enhanced Precise Routing Module
Handles zipcode+address routing for exact location-based routing
Integrates with existing routing platform without breaking compatibility
"""

import geopandas as gpd
import pandas as pd
from shapely.wkt import loads as wkt_loads


def get_precise_point(points_gdf, postcode, address=None, city=None):
    """
    Get precise point based on postcode and optional address/city
    Falls back to postcode-only if specific address not found
    
    Args:
        points_gdf: GeoDataFrame with points data
        postcode: Zipcode/postcode
        address: Optional specific address
        city: Optional specific city
        
    Returns:
        GeoDataFrame with matching points (single most precise match)
    """
    print(f"DEBUG: get_precise_point called with postcode={postcode}, address={address}, city={city}")
    
    # Start with postcode filter
    filtered_points = points_gdf[points_gdf['postcode'] == postcode]
    
    if filtered_points.empty:
        print(f"WARNING: No points found for postcode {postcode}")
        return filtered_points
    
    print(f"DEBUG: Found {len(filtered_points)} points for postcode {postcode}")
    
    # If we have address, try to get more precise match
    if address:
        # Normalize address for better matching
        address_normalized = address.lower().strip()
        
        # Try exact match first
        exact_match = filtered_points[
            filtered_points['address'].str.lower().str.strip() == address_normalized
        ]
        
        if not exact_match.empty:
            print(f"DEBUG: Found exact address match for '{address}': {len(exact_match)} points")
            return exact_match.head(1)
        
        # Try partial match (contains)
        partial_match = filtered_points[
            filtered_points['address'].str.lower().str.contains(address_normalized, case=False, na=False)
        ]
        
        if not partial_match.empty:
            print(f"DEBUG: Found partial address match for '{address}': {len(partial_match)} points")
            return partial_match.head(1)
        
        # Try matching key parts of the address (remove special characters and numbers)
        import re
        address_key_parts = re.sub(r'[^a-zA-Z\s]', '', address_normalized).strip()
        if address_key_parts:
            key_match = filtered_points[
                filtered_points['address'].str.lower().str.contains(address_key_parts, case=False, na=False)
            ]
            
            if not key_match.empty:
                print(f"DEBUG: Found key parts match for '{address_key_parts}': {len(key_match)} points")
                return key_match.head(1)
    
    # If we have city, try city-based filtering
    if city:
        city_match = filtered_points[
            filtered_points['city'].str.contains(city, case=False, na=False)
        ]
        
        if not city_match.empty:
            print(f"DEBUG: Found city-only match with '{city}': {len(city_match)} points")
            return city_match.head(1)
    
    # Fallback to first point with this postcode
    print(f"DEBUG: Using fallback - first point for postcode {postcode}")
    return filtered_points.head(1)


def get_precise_route_points(routes_gdf, postcode, address=None, city=None):
    """
    Get precise route data based on postcode and optional address/city
    
    Args:
        routes_gdf: GeoDataFrame with routes data
        postcode: Zipcode/postcode
        address: Optional specific address
        city: Optional specific city
        
    Returns:
        GeoDataFrame with matching route data
    """
    print(f"DEBUG: get_precise_route_points called with postcode={postcode}, address={address}, city={city}")
    
    # Start with postcode filter
    filtered_routes = routes_gdf[routes_gdf['postcode'] == postcode]
    
    if filtered_routes.empty:
        print(f"WARNING: No routes found for postcode {postcode}")
        return filtered_routes
    
    print(f"DEBUG: Found {len(filtered_routes)} routes for postcode {postcode}")
    
    # If we have address, try to get more precise match
    if address:
        # Normalize address for better matching
        address_normalized = address.lower().strip()
        
        # Try exact match first
        exact_match = filtered_routes[
            filtered_routes['address'].str.lower().str.strip() == address_normalized
        ]
        
        if not exact_match.empty:
            print(f"DEBUG: Found exact route address match for '{address}': {len(exact_match)} routes")
            return exact_match
        
        # Try partial match (contains)
        partial_match = filtered_routes[
            filtered_routes['address'].str.lower().str.contains(address_normalized, case=False, na=False)
        ]
        
        if not partial_match.empty:
            print(f"DEBUG: Found partial route address match for '{address}': {len(partial_match)} routes")
            return partial_match
        
        # Try matching key parts of the address
        import re
        address_key_parts = re.sub(r'[^a-zA-Z\s]', '', address_normalized).strip()
        if address_key_parts:
            key_match = filtered_routes[
                filtered_routes['address'].str.lower().str.contains(address_key_parts, case=False, na=False)
            ]
            
            if not key_match.empty:
                print(f"DEBUG: Found route key parts match for '{address_key_parts}': {len(key_match)} routes")
                return key_match
    
    # If we have city, try city-based filtering
    if city:
        city_match = filtered_routes[
            filtered_routes['city'].str.contains(city, case=False, na=False)
        ]
        
        if not city_match.empty:
            print(f"DEBUG: Found route city-only match with '{city}': {len(city_match)} routes")
            return city_match
    
    # Return all routes for this postcode
    print(f"DEBUG: Using all routes for postcode {postcode}")
    return filtered_routes


def enhance_table_output(routes_data, location_data_list=None, route_lengths=None):
    """
    Enhance table output to show which specific addresses were selected
    
    Args:
        routes_data: Route data from routing
        location_data_list: List of location data dictionaries
        route_lengths: List of calculated route lengths corresponding to location_data_list
        
    Returns:
        Enhanced HTML table with precise address information
    """
    if not location_data_list:
        return routes_data  # Return original if no location data
    
    # Process table to highlight selected addresses
    table_rows = []
    
    for i, location_data in enumerate(location_data_list):
        postcode = location_data.get('postcode', 'N/A')
        address = location_data.get('address', 'N/A')
        city = location_data.get('city', 'N/A')
        
        # Get route length if available, otherwise use 0
        length = 0
        if route_lengths and i < len(route_lengths):
            length = route_lengths[i]
        
        # Add highlighting to show this was the selected specific address
        table_rows.append(
            f"<tr class='selected-address-row'>"
            f"<td><strong>{address}</strong></td>"
            f"<td><strong>{city}</strong></td>"
            f"<td><strong>{postcode}</strong></td>"
            f"<td>{length}</td>"
            f"</tr>"
        )
    
    table_html = (
        "<table border='1' style='border-collapse: collapse; width: 100%; background: white;'>"
        "<thead><tr><th>Address</th><th>City</th><th>Postcode</th><th>Length</th></tr></thead>"
        "<tbody>" + "".join(table_rows) + "</tbody></table>"
        "<style>"
        "</style>"
    )
    
    return table_html


def log_routing_precision(start_location, end_locations, routing_mode):
    """
    Log routing precision information for debugging
    
    Args:
        start_location: Start location data
        end_locations: List of end location data
        routing_mode: Routing mode (multiple/roundtrip)
    """
    print("=" * 50)
    print("PRECISE ROUTING EXECUTION")
    print("=" * 50)
    print(f"Mode: {routing_mode}")
    print(f"Start: {start_location.get('postcode', 'N/A')} - {start_location.get('address', 'N/A')}, {start_location.get('city', 'N/A')}")
    
    print("End points:")
    for i, end_location in enumerate(end_locations):
        print(f"  {i+1}. {end_location.get('postcode', 'N/A')} - {end_location.get('address', 'N/A')}, {end_location.get('city', 'N/A')}")
    
    print("=" * 50)
