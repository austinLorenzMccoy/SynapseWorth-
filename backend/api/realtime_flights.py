"""
Real-time flight tracking API endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import logging

from services.flight_tracking import get_real_time_aircraft

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/flights", tags=["realtime"])

class AircraftResponse(BaseModel):
    """Aircraft data response model"""
    icao: str
    callsign: Optional[str] = None
    lat: float
    lon: float
    alt_ft: int
    speed_kts: Optional[int] = None
    heading: Optional[float] = None
    confidence: float
    cooperative: bool
    sensor_count: int
    is_ghost: bool = False
    color: str
    type: str = "UNKN"
    origin_country: Optional[str] = None
    position_source: int
    timestamp: str

class FlightDataResponse(BaseModel):
    """Flight data response model"""
    aircraft: List[AircraftResponse]
    total_count: int
    area_covered: str
    last_updated: str
    data_source: str = "OpenSky Network"

@router.get("/realtime", response_model=FlightDataResponse)
async def get_realtime_flights(
    lat_min: float = Query(51.0, description="Minimum latitude"),
    lon_min: float = Query(-1.0, description="Minimum longitude"),
    lat_max: float = Query(52.0, description="Maximum latitude"),
    lon_max: float = Query(0.0, description="Maximum longitude"),
    limit: int = Query(100, description="Maximum number of aircraft to return")
):
    """
    Get real-time flight data for specified area
    
    Args:
        lat_min, lon_min, lat_max, lon_max: Bounding box coordinates
        limit: Maximum number of aircraft to return
        
    Returns:
        Real-time flight data in MLAT-compatible format
    """
    try:
        # Validate bounding box
        if not (-90 <= lat_min <= 90 and -90 <= lat_max <= 90):
            raise HTTPException(status_code=400, detail="Invalid latitude range")
        if not (-180 <= lon_min <= 180 and -180 <= lon_max <= 180):
            raise HTTPException(status_code=400, detail="Invalid longitude range")
        if lat_min >= lat_max or lon_min >= lon_max:
            raise HTTPException(status_code=400, detail="Invalid bounding box")
        
        bbox = [lat_min, lon_min, lat_max, lon_max]
        
        # Get real-time aircraft data
        aircraft_data = await get_real_time_aircraft(bbox)
        
        # Limit results
        if len(aircraft_data) > limit:
            aircraft_data = aircraft_data[:limit]
        
        # Convert to response model
        aircraft_responses = [AircraftResponse(**ac) for ac in aircraft_data]
        
        return FlightDataResponse(
            aircraft=aircraft_responses,
            total_count=len(aircraft_responses),
            area_covered=f"{lat_min:.2f},{lon_min:.2f} to {lat_max:.2f},{lon_max:.2f}",
            last_updated=aircraft_data[0].get('timestamp', '') if aircraft_data else '',
            data_source="OpenSky Network"
        )
        
    except Exception as e:
        logger.error(f"Error getting real-time flight data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch real-time flight data: {str(e)}"
        )

@router.get("/london", response_model=FlightDataResponse)
async def get_london_flights(limit: int = Query(50, description="Maximum number of aircraft")):
    """
    Get real-time flights for London area (convenience endpoint)
    
    Args:
        limit: Maximum number of aircraft to return
        
    Returns:
        Real-time flight data for London area
    """
    return await get_realtime_flights(
        lat_min=51.0,
        lon_min=-1.0, 
        lat_max=52.0,
        lon_max=0.0,
        limit=limit
    )

@router.get("/stats")
async def get_flight_stats():
    """
    Get current flight statistics
    
    Returns:
        Flight statistics and system status
    """
    try:
        # Get current aircraft data
        aircraft_data = await get_real_time_aircraft()
        
        # Calculate statistics
        total_aircraft = len(aircraft_data)
        ads_b_aircraft = sum(1 for ac in aircraft_data if ac.get('cooperative', False))
        mlat_aircraft = total_aircraft - ads_b_aircraft
        
        # Altitude distribution
        alt_ranges = {
            'ground': sum(1 for ac in aircraft_data if ac.get('alt_ft', 0) < 1000),
            'low': sum(1 for ac in aircraft_data if 1000 <= ac.get('alt_ft', 0) < 10000),
            'medium': sum(1 for ac in aircraft_data if 10000 <= ac.get('alt_ft', 0) < 25000),
            'high': sum(1 for ac in aircraft_data if ac.get('alt_ft', 0) >= 25000)
        }
        
        # Top countries
        countries = {}
        for ac in aircraft_data:
            country = ac.get('origin_country', 'Unknown')
            countries[country] = countries.get(country, 0) + 1
        
        top_countries = sorted(countries.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "total_aircraft": total_aircraft,
            "ads_b_aircraft": ads_b_aircraft,
            "mlat_aircraft": mlat_aircraft,
            "cooperative_rate": f"{(ads_b_aircraft / total_aircraft * 100):.1f}%" if total_aircraft > 0 else "0%",
            "altitude_distribution": alt_ranges,
            "top_countries": [{"country": c, "count": count} for c, count in top_countries],
            "data_source": "OpenSky Network",
            "last_updated": aircraft_data[0].get('timestamp', '') if aircraft_data else '',
            "coverage_area": "London Area (51.0,-1.0 to 52.0,0.0)"
        }
        
    except Exception as e:
        logger.error(f"Error getting flight stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch flight statistics: {str(e)}"
        )

@router.get("/aircraft/{icao}")
async def get_aircraft_details(icao: str):
    """
    Get details for a specific aircraft by ICAO code
    
    Args:
        icao: ICAO 24-bit aircraft identifier
        
    Returns:
        Aircraft details if found
    """
    try:
        aircraft_data = await get_real_time_aircraft()
        
        # Find aircraft by ICAO code
        target_aircraft = None
        for ac in aircraft_data:
            if ac.get('icao', '').upper() == icao.upper():
                target_aircraft = ac
                break
        
        if not target_aircraft:
            raise HTTPException(
                status_code=404,
                detail=f"Aircraft with ICAO code {icao} not found"
            )
        
        return AircraftResponse(**target_aircraft)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting aircraft details: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch aircraft details: {str(e)}"
        )
