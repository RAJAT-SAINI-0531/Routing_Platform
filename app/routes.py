from flask import *
from app import app, geoms, routes_gdf, points, route
from app.forms import UserForm
import json
from bson import json_util, Int64
import logging
import subprocess
import os
import re
import uuid
import traceback
import geopandas as gpd
from pathlib import Path
from shapely import wkt
from shapely.geometry import Point
import sys

# Add processing directory to path for enhanced routing
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'processing'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'processing', 'enhanced'))

try:
    from enhanced.precise_routing import get_precise_point, get_precise_route_points, enhance_table_output, log_routing_precision
    ENHANCED_ROUTING_AVAILABLE = True
    print("Enhanced precise routing module loaded successfully")
except ImportError as e:
    print(f"Enhanced routing module not available: {e}")
    ENHANCED_ROUTING_AVAILABLE = False

# Get base directory - Windows compatible
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
ROUTING_DATA_DIR = BASE_DIR / "routing_data"

# Create directories if they don't exist
ROUTING_DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / "zip_start").mkdir(parents=True, exist_ok=True)
(DATA_DIR / "zip_end").mkdir(parents=True, exist_ok=True)
(DATA_DIR / "routes").mkdir(parents=True, exist_ok=True)


@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
def index():
    return render_template("index.html")

@app.route('/test_roundtrip.html', methods=['GET'])
def test_roundtrip():
    """Serve the test HTML file for debugging"""
    try:
        with open(os.path.join(BASE_DIR, 'test_roundtrip.html'), 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>Test file not found</h1>", 404

@app.route('/zipcode_suggestions_demo.html', methods=['GET'])
def zipcode_suggestions_demo():
    """Serve the zipcode suggestions demo page"""
    try:
        with open(os.path.join(BASE_DIR, 'zipcode_suggestions_demo.html'), 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>Demo file not found</h1>", 404

@app.route('/add_to_db', methods=['POST'])
def add_to_db():
    if request.is_json:
        geojson_data = request.get_json()
        geoms.insert_one(geojson_data)

    return {"message" : "Data received"}

@app.route('/data/unique_cluj.geojson', methods=['GET'])
def serve_zipcode_data():
    """Serve the zipcode data for suggestions"""
    try:
        geojson_path = DATA_DIR / "unique_cluj.geojson"
        if geojson_path.exists():
            return send_file(str(geojson_path), mimetype='application/json')
        else:
            return {"error": "Zipcode data file not found"}, 404
    except Exception as e:
        print(f"Error serving zipcode data: {e}")
        return {"error": "Failed to load zipcode data"}, 500
    
    

@app.route('/delete', methods=['POST'])
def delete():
    if request.is_json:
        data = request.get_json()
        id_to_delete = Int64(data['id'])
        geoms.delete_one({"id": id_to_delete})

    return {"message" : "Data deleted"}

@app.route('/get_zip_r', methods=['GET'])
def get_zip_r():
    start_zip = request.args.get('startZip')
    end_zip = request.args.get('endZip')
    end_zips = [z.strip() for z in end_zip.split(',') if z.strip()]
    
    # Enhanced: Get specific address data for precise routing
    start_address = request.args.get('startAddress', '')
    start_city = request.args.get('startCity', '')
    end_addresses = request.args.get('endAddresses', '').split('|') if request.args.get('endAddresses') else []
    end_cities = request.args.get('endCities', '').split('|') if request.args.get('endCities') else []

    # Use enhanced routing if available and location data provided
    use_enhanced_routing = (ENHANCED_ROUTING_AVAILABLE and 
                           (start_address or start_city or end_addresses or end_cities))
    
    if use_enhanced_routing:
        print("Using enhanced precise routing")
        # Get precise start point
        start_point = get_precise_point(points, start_zip, start_address, start_city)
    else:
        print("Using standard postcode-only routing")
        start_point = points[points['postcode'] == start_zip]
    
    all_routes = []
    table_rows = []
    route_lengths = []  # Collect route lengths for enhanced table

    for i, ezip in enumerate(end_zips):
        if use_enhanced_routing and i < len(end_addresses) and i < len(end_cities):
            # Use enhanced routing for precise end points
            end_point = get_precise_point(points, ezip, end_addresses[i], end_cities[i])
            zip_routes = get_precise_route_points(routes_gdf, ezip, end_addresses[i], end_cities[i])
        else:
            # Standard routing
            end_point = points[points['postcode'] == ezip]
            zip_routes = routes_gdf[routes_gdf['postcode'] == ezip]
        if not zip_routes.empty:
            formatted = zip_routes.loc[:, ['address', 'city', 'postcode', 'length']]
            # Get the route length for this destination
            route_length = formatted.iloc[0]['length'] if len(formatted) > 0 else 0
            route_lengths.append(round(float(route_length), 2) if route_length else 0)
            
            for _, row in formatted.iterrows():
                table_rows.append(
                    f"<tr><td>{row['address']}</td><td>{row['city']}</td><td>{row['postcode']}</td><td>{row['length']}</td></tr>"
                )
            all_routes.append({
                'end': end_point.to_json(),
                'route': zip_routes.to_json()
            })
        else:
            # Fallback for missing route
            route_lengths.append(0)
            table_rows.append(
                f"<tr><td>N/A</td><td>N/A</td><td>{ezip}</td><td>0</td></tr>"
            )
            all_routes.append({
                'end': end_point.to_json() if not end_point.empty else '{"type":"FeatureCollection","features":[]}',
                'route': '{"type":"FeatureCollection","features":[]}'
            })

    # Generate enhanced table if using precise routing
    if use_enhanced_routing and ENHANCED_ROUTING_AVAILABLE:
        try:
            # Create location data for table enhancement
            end_location_data = []
            for i, ezip in enumerate(end_zips):
                location_data = {'postcode': ezip}
                if i < len(end_addresses) and end_addresses[i]:
                    location_data['address'] = end_addresses[i]
                if i < len(end_cities) and end_cities[i]:
                    location_data['city'] = end_cities[i]
                end_location_data.append(location_data)
            
            table_html = enhance_table_output(None, end_location_data, route_lengths)
        except Exception as e:
            print(f"Error generating enhanced table: {e}")
            # Fallback to standard table
            table_html = (
                "<table border='1' style='border-collapse: collapse; width: 100%; background: white;'>"
                "<thead><tr><th>address</th><th>city</th><th>postcode</th><th>length</th></tr></thead>"
                "<tbody>" + "".join(table_rows) + "</tbody></table>"
            )
    else:
        table_html = (
            "<table border='1' style='border-collapse: collapse; width: 100%; background: white;'>"
            "<thead><tr><th>address</th><th>city</th><th>postcode</th><th>length</th></tr></thead>"
            "<tbody>" + "".join(table_rows) + "</tbody></table>"
        )

    return app.response_class(
        response=json.dumps({
            'start': start_point.to_json(),
            'routes': all_routes,
            'routes_html': table_html,
            'is_multiple': len(end_zips) > 1
        }),
        status=200,
        mimetype='application/json; charset=utf-8'
    )


@app.route('/get_zip_roundtrip', methods=['GET'])
def get_zip_roundtrip():
    """
    Round Trip Feature: A→B→C→…→A
    Generates sequential routes connecting all waypoints and returning to start
    """
    start_zip = request.args.get('startZip')
    waypoints_str = request.args.get('waypoints', '')
    waypoints = [w.strip() for w in waypoints_str.split(',') if w.strip()]
    
    # Enhanced: Get specific address data for precise routing
    start_address = request.args.get('startAddress', '')
    start_city = request.args.get('startCity', '')
    end_addresses = request.args.get('endAddresses', '').split('|') if request.args.get('endAddresses') else []
    end_cities = request.args.get('endCities', '').split('|') if request.args.get('endCities') else []
    
    # DEBUG: Log all received parameters
    print(f"DEBUG ROUNDTRIP: Received parameters:")
    print(f"  start_zip: {start_zip}")
    print(f"  waypoints: {waypoints}")
    print(f"  start_address: '{start_address}'")
    print(f"  start_city: '{start_city}'")
    print(f"  end_addresses: {end_addresses}")
    print(f"  end_cities: {end_cities}")
    print(f"  Raw endAddresses param: '{request.args.get('endAddresses', '')}'")
    print(f"  Raw endCities param: '{request.args.get('endCities', '')}'")
    
    if not waypoints:
        return jsonify({'error': 'No waypoints provided'}), 400
    
    # Create full journey: start → waypoint1 → waypoint2 → ... → start
    full_route = [start_zip] + waypoints + [start_zip]
    
    # Use enhanced routing if available and location data provided
    use_enhanced_routing = (ENHANCED_ROUTING_AVAILABLE and 
                           (start_address or start_city or end_addresses or end_cities))
    
    # Get start point with address precision if available using precise routing function
    if use_enhanced_routing and start_address and start_city:
        start_point = get_precise_point(points, start_zip, start_address, start_city)
    else:
        start_point = points[points['postcode'] == start_zip]
    
    if start_point.empty:
        return jsonify({'error': f'Start postcode {start_zip} not found'}), 404
    
    all_routes = []
    table_rows = []
    total_distance = 0
    
    # Use enhanced routing if available and location data provided
    use_enhanced_routing = (ENHANCED_ROUTING_AVAILABLE and 
                           (start_address or start_city or end_addresses or end_cities))
    
    if use_enhanced_routing:
        print("DEBUG: Using enhanced precise routing for round trip")
        print(f"DEBUG: Start: {start_zip} - {start_address}, {start_city}")
        print(f"DEBUG: End addresses: {end_addresses}")
        print(f"DEBUG: End cities: {end_cities}")
    
    # Generate sequential routes using precise location data
    for i in range(len(full_route) - 1):
        from_zip = full_route[i]
        to_zip = full_route[i + 1]
        
        # Get precise points for this segment
        if use_enhanced_routing:
            # For start point
            if i == 0:  # First segment uses start location data
                from_point = get_precise_point(points, from_zip, start_address, start_city)
            else:
                # For intermediate points, try to use end location data from previous segment
                prev_idx = i - 1
                if prev_idx < len(end_addresses) and prev_idx < len(end_cities):
                    from_point = get_precise_point(points, from_zip, end_addresses[prev_idx], end_cities[prev_idx])
                else:
                    from_point = points[points['postcode'] == from_zip]
            
            # For end point
            if i < len(end_addresses) and i < len(end_cities) and end_addresses[i] and end_cities[i]:
                # Regular waypoint with specific address
                to_point = get_precise_point(points, to_zip, end_addresses[i], end_cities[i])
                selected_address = end_addresses[i]
                selected_city = end_cities[i]
            elif to_zip == start_zip:
                # Returning to start - use precise start point
                to_point = get_precise_point(points, to_zip, start_address, start_city)
                selected_address = start_address
                selected_city = start_city
            else:
                # Fallback to any point for this zipcode
                to_point = points[points['postcode'] == to_zip]
                selected_address = to_point.iloc[0].get('address', 'N/A') if not to_point.empty else 'N/A'
                selected_city = to_point.iloc[0].get('city', 'N/A') if not to_point.empty else 'N/A'
        else:
            # Standard routing
            from_point = points[points['postcode'] == from_zip] 
            
            # For standard routing, still check if returning to start
            if to_zip == start_zip and start_address and start_city:
                # Returning to start - try to use precise start point even in standard mode
                to_point = get_precise_point(points, to_zip, start_address, start_city)
                selected_address = start_address
                selected_city = start_city
            else:
                to_point = points[points['postcode'] == to_zip]
                selected_address = to_point.iloc[0].get('address', 'N/A') if not to_point.empty else 'N/A'
                selected_city = to_point.iloc[0].get('city', 'N/A') if not to_point.empty else 'N/A'
        
        if from_point.empty or to_point.empty:
            # Add placeholder for missing segments
            table_rows.append(
                f"<tr><td>{from_zip}</td><td>{to_zip}</td><td>Route not available</td><td>N/A</td><td>0</td></tr>"
            )
            continue
            
        # Try to find existing route data with precision if available
        available_routes = None
        try:
            if routes_gdf is not None and not routes_gdf.empty:
                if use_enhanced_routing and i < len(end_addresses) and i < len(end_cities) and end_addresses[i] and end_cities[i]:
                    # Use precise route matching
                    available_routes = get_precise_route_points(routes_gdf, to_zip, end_addresses[i], end_cities[i])
                    print(f"DEBUG: Found {len(available_routes) if not available_routes.empty else 0} precise routes for {to_zip} - {end_addresses[i]}")
                else:
                    # Standard route matching
                    available_routes = routes_gdf[routes_gdf['postcode'] == to_zip]
        except Exception as e:
            print(f"DEBUG: Error in route matching: {e}")
            pass
            
        if available_routes is not None and not available_routes.empty:
            # Use available route data
            route_info = available_routes.iloc[0]
            segment_length = getattr(route_info, 'length', 0)
            
            all_routes.append({
                'end': to_point.to_json(),
                'route': available_routes.to_json(),
                'segment': f"{from_zip} → {to_zip}"
            })
            
            # Use the precise selected address in table
            table_rows.append(
                f"<tr><td>{from_zip}</td><td>{to_zip}</td><td><strong>{selected_address}</strong></td><td>{selected_city}</td><td>{round(float(segment_length), 2) if segment_length else 0}</td></tr>"
            )
            total_distance += float(segment_length) if segment_length else 0
        else:
            # Create a mock route for visualization using straight line distance
            import math
            from_coords = from_point.iloc[0].geometry
            to_coords = to_point.iloc[0].geometry
            
            # Calculate approximate distance (in meters)
            lat1, lon1 = from_coords.y, from_coords.x  
            lat2, lon2 = to_coords.y, to_coords.x
            
            # Simple distance calculation (not exact, but for demo purposes)
            R = 6371000  # Earth's radius in meters
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = (math.sin(dlat/2)**2 + 
                 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
                 math.sin(dlon/2)**2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance = R * c
            
            # Create mock route geometry (straight line)
            mock_route = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString", 
                        "coordinates": [[lon1, lat1], [lon2, lat2]]
                    },
                    "properties": {
                        "length": distance,
                        "from_zip": from_zip,
                        "to_zip": to_zip
                    }
                }]
            }
            
            all_routes.append({
                'end': to_point.to_json(),
                'route': json.dumps(mock_route),
                'segment': f"{from_zip} → {to_zip}"
            })
            
            # Use the precise selected address in table
            table_rows.append(
                f"<tr><td>{from_zip}</td><td>{to_zip}</td><td><strong>{selected_address}</strong></td><td>{selected_city}</td><td>{round(distance, 2)}</td></tr>"
            )
            total_distance += distance
    
    # Add total distance row
    table_rows.append(
        f"<tr style='font-weight: bold; background-color: #f0f0f0;'><td colspan='4'>TOTAL ROUND TRIP DISTANCE</td><td>{round(total_distance, 2)}</td></tr>"
    )
    
    # Enhanced table with styling for selected addresses
    table_html = (
        "<table border='1' style='border-collapse: collapse; width: 100%; background: white;'>"
        "<thead><tr><th>From</th><th>To</th><th>Address</th><th>City</th><th>Length (m)</th></tr></thead>"
        "<tbody>" + "".join(table_rows) + "</tbody></table>"
        "<style>"
        "</style>"
    )

    return app.response_class(
        response=json.dumps({
            'start': start_point.to_json(),
            'routes': all_routes,
            'routes_html': table_html,
            'is_multiple': True,
            'is_roundtrip': True,
            'total_distance': round(total_distance, 2),
            'waypoint_sequence': ' → '.join(full_route)
        }),
        status=200,
        mimetype='application/json; charset=utf-8'
    )



@app.route('/get_zip_route', methods=['GET'])
def get_zip_route():
    try:
        start_zip = request.args.get('startZip')
        end_zip = request.args.get('endZip')
        
        print(f"DEBUG: Received request - Start: {start_zip}, End: {end_zip}")
        
        # Check if multiple end zips are provided (comma-separated)
        end_zips = [zip.strip() for zip in end_zip.split(',') if zip.strip()]
        
        print(f"DEBUG: Parsed end_zips: {end_zips}")
        
        if len(end_zips) == 1:
            # Single destination logic
            cache_key = f"{start_zip}_to_{end_zips[0]}"
            print(f"DEBUG: Single route, checking cache for: {cache_key}")
            
            if cached_route := route.find_one({"route_key": cache_key}):
                print("DEBUG: Found cached route")
                cached_route['geometry'] = wkt.loads(cached_route['geometry'])
                cached_route['_id'] = str(cached_route["_id"])
                routes_gdf = gpd.GeoDataFrame([cached_route], geometry='geometry')
                routes_gdf.set_crs("EPSG:4326", inplace=True)
                
                start_point = points[points['postcode'] == start_zip]
                end_point = points[points['postcode'] == end_zips[0]]
                
                return app.response_class(
                    response=json.dumps({
                        'start': start_point.to_json(),
                        'end': end_point.to_json(),
                        'routes': routes_gdf.to_json()
                    }),
                    status=200,
                    mimetype='application/json; charset=utf-8'
                )
            
            print("DEBUG: No cached route, calculating new single route")
            # Calculate new single route
            route_id = uuid.uuid1()
            start_point = points[points['postcode'] == start_zip]
            end_point = points[points['postcode'] == end_zips[0]]
            
            start_point_path = DATA_DIR / "zip_start" / f"start_{route_id}.gpkg"
            end_point_path = DATA_DIR / "zip_end" / f"end_{route_id}.gpkg"
            route_path = DATA_DIR / "routes" / f"final_output_{route_id}.gpkg"

            start_point.to_file(start_point_path, driver='GPKG')
            end_point.to_file(end_point_path, driver='GPKG')

            run_routes(str(start_point_path), str(end_point_path), str(route_path))
            routes_gdf = gpd.read_file(route_path)
            
            # Cache the result
            if 'route_key' not in routes_gdf.columns:
                routes_gdf['route_key'] = None
            routes_gdf.at[routes_gdf.index[-1], 'route_key'] = cache_key
            row = routes_gdf.iloc[-1].to_dict()
            row['geometry'] = row['geometry'].wkt
            route.insert_one(row)
            
            return app.response_class(
                response=json.dumps({
                    'start': start_point.to_json(),
                    'end': end_point.to_json(),
                    'routes': routes_gdf.to_json()
                }),
                status=200,
                mimetype='application/json; charset=utf-8'
            )
        
        else:
            print(f"DEBUG: Multiple routes for {len(end_zips)} destinations")
            # Multiple destinations logic
            start_point = points[points['postcode'] == start_zip]
            all_routes_data = []
            all_routes_info = []
            
            for end_zip_single in end_zips:
                print(f"DEBUG: Processing route to {end_zip_single}")
                cache_key = f"{start_zip}_to_{end_zip_single}"
                
                # Check cache for each route
                if cached_route := route.find_one({"route_key": cache_key}):
                    print(f"DEBUG: Found cached route for {end_zip_single}")
                    cached_route['geometry'] = wkt.loads(cached_route['geometry'])
                    cached_route['_id'] = str(cached_route["_id"])
                    routes_gdf = gpd.GeoDataFrame([cached_route], geometry='geometry')
                    routes_gdf.set_crs("EPSG:4326", inplace=True)
                else:
                    print(f"DEBUG: Calculating new route for {end_zip_single}")
                    # Calculate new route
                    route_id = uuid.uuid1()
                    end_point = points[points['postcode'] == end_zip_single]
                    
                    start_point_path = DATA_DIR / "zip_start" / f"start_{route_id}.gpkg"
                    end_point_path = DATA_DIR / "zip_end" / f"end_{route_id}.gpkg"
                    route_path = DATA_DIR / "routes" / f"final_output_{route_id}.gpkg"

                    start_point.to_file(start_point_path, driver='GPKG')
                    end_point.to_file(end_point_path, driver='GPKG')

                    run_routes(str(start_point_path), str(end_point_path), str(route_path))
                    routes_gdf = gpd.read_file(route_path)
                    
                    # Cache the route
                    if 'route_key' not in routes_gdf.columns:
                        routes_gdf['route_key'] = None
                    routes_gdf.at[routes_gdf.index[-1], 'route_key'] = cache_key
                    row = routes_gdf.iloc[-1].to_dict()
                    row['geometry'] = row['geometry'].wkt
                    route.insert_one(row)
                
                end_point = points[points['postcode'] == end_zip_single]
                
                # Store route data
                all_routes_data.append({
                    'end': end_point.to_json(),
                    'route': routes_gdf.to_json()
                })
                
                # Get correct route info from the end point (not from route geometry)
                if not end_point.empty:
                    end_point_info = end_point.iloc[0]
                    route_length = routes_gdf.iloc[-1].get('length', 0) if len(routes_gdf) > 0 else 0
                    
                    all_routes_info.append({
                        'start_zip': start_zip,
                        'end_zip': end_zip_single,
                        'address': end_point_info.get('address', 'N/A'),
                        'city': end_point_info.get('city', 'N/A'),
                        'postcode': end_zip_single,
                        'length': round(float(route_length), 2) if route_length else 0
                    })
                else:
                    all_routes_info.append({
                        'start_zip': start_zip,
                        'end_zip': end_zip_single,
                        'address': 'N/A',
                        'city': 'N/A',
                        'postcode': end_zip_single,
                        'length': 0
                    })
            
            print(f"DEBUG: Generated {len(all_routes_info)} routes")
            
            # Create HTML table for multiple routes
            table_html = "<table border='1' style='border-collapse: collapse; width: 100%; background: white;'>"
            table_html += "<thead><tr><th>From</th><th>To</th><th>Address</th><th>City</th><th>Postcode</th><th>Length (m)</th></tr></thead><tbody>"
            
            for info in all_routes_info:
                table_html += f"<tr><td>{info['start_zip']}</td><td>{info['end_zip']}</td><td>{info['address']}</td><td>{info['city']}</td><td>{info['postcode']}</td><td>{info['length']}</td></tr>"
            
            table_html += "</tbody></table>"
            
            print("DEBUG: Returning multiple routes response")
            return app.response_class(
                response=json.dumps({
                    'start': start_point.to_json(),
                    'routes': all_routes_data,
                    'routes_html': table_html,
                    'is_multiple': True
                }),
                status=200,
                mimetype='application/json; charset=utf-8'
            )
            
    except Exception as e:
        print(f"ERROR in get_zip_route: {str(e)}")
        import traceback
        traceback.print_exc()
        return app.response_class(
            response=json.dumps({'error': str(e)}),
            status=500,
            mimetype='application/json; charset=utf-8'
        )



@app.route('/get_addr_zip_route', methods=['GET'])
def get_addr_zip_route():
    start_point = request.args.get('startPoint')
    end_point = request.args.get('endPoint')

    start_coords = parse_coords(start_point)
    start_p = gpd.GeoSeries([Point(float(start_coords[1]), float(start_coords[0]))], crs="EPSG:4326")

    end_p = points[points['postcode'] == end_point]
    
    
    if interest_route := route.find_one({"start_point" : start_point, "end_point": end_point}):     
        interest_route['geometry'] = wkt.loads(interest_route['geometry']) 
        interest_route['_id'] = str(interest_route["_id"]) 
        gdf = gpd.GeoDataFrame([interest_route], geometry='geometry')
        gdf.set_crs("EPSG:4326", inplace=True)
                
        return {
            'start' : start_p.to_json(),
            'end' : end_p.to_json(),
            'route': gdf.to_json()
        }
    route_id = uuid.uuid1()

    start_point_path = DATA_DIR / "zip_start" / f"start_{route_id}.gpkg"
    end_point_path = DATA_DIR / "zip_end" / f"end_{route_id}.gpkg"
    route_path = DATA_DIR / "routes" / f"final_output_{route_id}.gpkg"

    start_p.to_file(start_point_path, driver='GPKG')
    end_p.to_file(end_point_path, driver='GPKG')

    run_routes(str(start_point_path), str(end_point_path), str(route_path))

    routes_gdf = gpd.read_file(route_path)
    if 'start_point' not in routes_gdf.columns:
        routes_gdf['start_point'] = None
    if 'end_point' not in routes_gdf.columns:
        routes_gdf['end_point'] = None



    routes_gdf.at[routes_gdf.index[-1], 'start_point'] = start_point
    routes_gdf.at[routes_gdf.index[-1], 'end_point'] = end_point
    row = routes_gdf.iloc[-1].to_dict()
    row['geometry'] = row['geometry'].wkt
    route.insert_one(row)



    return {
        'start' : start_p.to_json(),
        'end' : end_p.to_json(),
        'route': routes_gdf.to_json()
    }
    
    
    
    
    
@app.route('/get_address_route', methods=['GET'])
def get_address_route():
    start_point = request.args.get('startPoint') 
    end_point = request.args.get('endPoint')


    start_coords = parse_coords(start_point)
    end_coords = parse_coords(end_point)

    start_p = gpd.GeoSeries([Point(float(start_coords[1]), float(start_coords[0]))], crs="EPSG:4326")
    end_p = gpd.GeoSeries([Point(float(end_coords[1]), float(end_coords[0]))], crs="EPSG:4326")

    if interest_route := route.find_one({"start_point" : start_point, "end_point": end_point}):     
        interest_route['geometry'] = wkt.loads(interest_route['geometry']) 
        interest_route['_id'] = str(interest_route["_id"]) 
        gdf = gpd.GeoDataFrame([interest_route], geometry='geometry')
        gdf.set_crs("EPSG:4326", inplace=True)
                
        return {
            'start' : start_p.to_json(),
            'end' : end_p.to_json(),
            'route': gdf.to_json()
        }


    route_id = uuid.uuid1()

    start_point_path = DATA_DIR / "zip_start" / f"start_{route_id}.gpkg"
    end_point_path = DATA_DIR / "zip_end" / f"end_{route_id}.gpkg"
    route_path = DATA_DIR / "routes" / f"final_output_{route_id}.gpkg"


    start_p.to_file(start_point_path, driver='GPKG')
    end_p.to_file(end_point_path, driver='GPKG')

    run_routes(str(start_point_path), str(end_point_path), str(route_path))



    routes_gdf = gpd.read_file(route_path)
    if 'start_point' not in routes_gdf.columns:
        routes_gdf['start_point'] = None
    if 'end_point' not in routes_gdf.columns:
        routes_gdf['end_point'] = None

    routes_gdf.at[routes_gdf.index[-1], 'start_point'] = start_point
    routes_gdf.at[routes_gdf.index[-1], 'end_point'] = end_point
    row = routes_gdf.iloc[-1].to_dict()
    row['geometry'] = row['geometry'].wkt
    route.insert_one(row)



    return {
        'start' : start_p.to_json(),
        'end' : end_p.to_json(),
        'route': routes_gdf.to_json()
    }
    

@app.route('/get_zip_addr_route', methods=['GET'])
def get_zip_addr_route():
    start_point = request.args.get('startPoint')
    end_point = request.args.get('endPoint')

    end_coords = parse_coords(end_point)
    end_p = gpd.GeoSeries([Point(float(end_coords[1]), float(end_coords[0]))], crs="EPSG:4326")

    start_p = points[points['postcode'] == start_point]
    
    if interest_route := route.find_one({"start_point" : start_point, "end_point": end_point}):     
        interest_route['geometry'] = wkt.loads(interest_route['geometry']) 
        interest_route['_id'] = str(interest_route["_id"]) 
        gdf = gpd.GeoDataFrame([interest_route], geometry='geometry')
        gdf.set_crs("EPSG:4326", inplace=True)
                
        return {
            'start' : start_p.to_json(),
            'end' : end_p.to_json(),
            'route': gdf.to_json()
        }
    route_id = uuid.uuid1()

    start_point_path = DATA_DIR / "zip_start" / f"start_{route_id}.gpkg"
    end_point_path = DATA_DIR / "zip_end" / f"end_{route_id}.gpkg"
    route_path = DATA_DIR / "routes" / f"final_output_{route_id}.gpkg"


    start_p.to_file(start_point_path, driver='GPKG')
    end_p.to_file(end_point_path, driver='GPKG')

    run_routes(str(start_point_path), str(end_point_path), str(route_path))

    routes_gdf = gpd.read_file(route_path)
    if 'start_point' not in routes_gdf.columns:
        routes_gdf['start_point'] = None
    if 'end_point' not in routes_gdf.columns:
        routes_gdf['end_point'] = None



    routes_gdf.at[routes_gdf.index[-1], 'start_point'] = start_point
    routes_gdf.at[routes_gdf.index[-1], 'end_point'] = end_point
    row = routes_gdf.iloc[-1].to_dict()
    row['geometry'] = row['geometry'].wkt
    route.insert_one(row)



    return {
        'start' : start_p.to_json(),
        'end' : end_p.to_json(),
        'route': routes_gdf.to_json()
    }
    
    




def parse_coords(point):
    if coords_match := re.search(r'(?<=LatLng\().+(?=\))', point):
        return coords_match.group().split(', ')
























@app.route('/get_route', methods=['GET'])
def get_route():
    start_id = request.args.get('startId')
    end_id = request.args.get('endId')
    
    start_path = retrieve_data(start_id, 'start')
    end_path = retrieve_data(end_id, 'end')
    
    logging.debug(start_path, end_path)
    
    # Use run_routes instead of process_routes
    output_path = BASE_DIR / "FinalShortestPath_output.gpkg"
    run_routes(start_path, end_path, str(output_path))

    routes_gdf = gpd.read_file(output_path)
    return routes_gdf.to_json()
        
        








def retrieve_data(id, location):
    db_collection = geoms.find({"id" : Int64(id)})
    collection = json.loads(json_util.dumps(db_collection))

    gdf = gpd.GeoDataFrame.from_features(collection[0]['features'])
    gdf.set_crs("EPSG:4326", inplace=True)
    path = ROUTING_DATA_DIR / f"{location}_{id}.gpkg"
    gdf.to_file(path, driver="GPKG")
    return str(path)
    
    

# def process_routes(start, end):
#     output_path = '/home/pgs_admin/routing_platform/output.gpkg'
    
#     try:
#         result = subprocess.run(
#             ['python3', '/home/pgs_admin/routing_platform/test_routing.py', start, end],
#             capture_output=True,
#             text=True,
#             check=True
#         )

#         if os.path.exists(output_path):
#             return output_path

#         with open(output_path, 'w') as f:
#             f.write(result.stdout)

#         return output_path
#     except subprocess.CalledProcessError as e:
#         logging.error(f"Error occurred while running test_routing: {e.stderr or str(e)}")
#         return None
    

#### GOOD ROUTES FUNCTIONS ####

def run_routes(start, end, output):
    try:
        result = subprocess.run(
            ['python', str(BASE_DIR / 'processing' / 'run_routing.py'), start, end, output],
            capture_output=True,
            text=True,
            check=True
        )

        if os.path.exists(output):
            return output

        with open(output, 'w+') as f:
            f.write(result.stdout)

        return output
    except subprocess.CalledProcessError as e:
        logging.error(f"Error occurred while running test_routing: {e.stderr or str(e)}")
        return None


@app.route('/get_layer_data/<layer_id>', methods=['GET'])
def get_layer_data(layer_id):
    try:
        layer_data = geoms.find_one({"id": Int64(layer_id)})
        if layer_data:
            return app.response_class(
                response=json.dumps(layer_data, default=json_util.default),
                status=200,
                mimetype='application/json'
            )
        else:
            return {"error": "Layer not found"}, 404
    except Exception as e:
        return {"error": str(e)}, 500


