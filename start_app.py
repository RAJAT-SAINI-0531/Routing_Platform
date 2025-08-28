#!/usr/bin/env python3
"""
Simple test to check if the Flask app can start and the endpoints work
"""

import sys
import os
from pathlib import Path

# Get the directory where this script is located
current_dir = Path(__file__).parent.absolute()

# Add the current project directory to Python path
sys.path.insert(0, str(current_dir))

try:
    from app import app
    print("✅ Flask app imported successfully")
    
    # Check if all required data is available
    from app import points, routes_gdf
    
    if points is not None:
        print(f"✅ Points data loaded: {len(points)} points available")
        sample_postcodes = points['postcode'].head(5).tolist()
        print(f"   Sample postcodes: {sample_postcodes}")
    else:
        print("❌ Points data not loaded")
        
    if routes_gdf is not None:
        print(f"✅ Routes data loaded: {len(routes_gdf)} routes available")
    else:
        print("❌ Routes data not loaded")
        
    print("\nStarting Flask development server...")
    print("Visit http://localhost:5000/test_roundtrip.html to test the round trip feature")
    app.run(debug=True, host='0.0.0.0', port=5000)
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure all dependencies are installed")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
