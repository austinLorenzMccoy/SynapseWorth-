"""
Real-time flight tracking service using OpenSky Network API
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class FlightTrackingService:
    """Real-time flight tracking using OpenSky Network API"""
    
    def __init__(self):
        self.opensky_api = "https://opensky-network.org/api"
        self.session: Optional[aiohttp.ClientSession] = None
        self.last_update: Optional[datetime] = None
        self.cache_timeout = 30  # seconds
        self.cached_data: Dict[str, Any] = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_all_aircraft(self, bbox: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Get all aircraft states from OpenSky Network
        
        Args:
            bbox: [lat_min, lon_min, lat_max, lon_max] bounding box
                 Default: London area [51.0, -1.0, 52.0, 0.0]
        
        Returns:
            Dictionary with aircraft data
        """
        if not self.session:
            raise RuntimeError("FlightTrackingService not initialized")
        
        # Use cache if recent
        if (self.last_update and 
            datetime.utcnow() - self.last_update < timedelta(seconds=self.cache_timeout) and
            self.cached_data):
            return self.cached_data
        
        try:
            # Default to London area for demo
            if bbox is None:
                bbox = [51.0, -1.0, 52.0, 0.0]  # London area
            
            params = {
                'lamin': bbox[0],
                'lomin': bbox[1], 
                'lamax': bbox[2],
                'lomax': bbox[3]
            }
            
            async with self.session.get(
                f"{self.opensky_api}/states/all",
                params=params,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Cache the data
                    self.cached_data = data
                    self.last_update = datetime.utcnow()
                    
                    logger.info(f"Retrieved {len(data.get('states', []))} aircraft from OpenSky")
                    return data
                else:
                    logger.error(f"OpenSky API error: {response.status}")
                    return self.cached_data or {"states": []}
                    
        except asyncio.TimeoutError:
            logger.error("OpenSky API timeout")
            return self.cached_data or {"states": []}
        except Exception as e:
            logger.error(f"Error fetching flight data: {e}")
            return self.cached_data or {"states": []}
    
    def convert_to_mlat_format(self, opensky_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Convert OpenSky data to MLAT format
        
        Args:
            opensky_data: Raw OpenSky API response
            
        Returns:
            List of aircraft in MLAT format
        """
        aircraft_list = []
        states = opensky_data.get('states', [])
        
        # OpenSky state vector format:
        # [0] icao24, [1] callsign, [2] origin_country, [3] time_position,
        # [4] time_velocity, [5] longitude, [6] latitude, [7] geo_altitude,
        # [8] on_ground, [9] velocity, [10] heading, [11] vertical_rate,
        # [12] sensors, [13] baro_altitude, [14] squawk, [15] emergency,
        # [16] position_source, [17] category
        
        for state in states:
            try:
                icao = state[0]
                callsign = state[1]?.strip() or ""
                lat = state[6]
                lon = state[5]
                alt_ft = state[7]  # geometric altitude in meters, convert to feet
                speed_kts = state[9]  # velocity in m/s, convert to knots
                heading = state[10]  # heading in degrees
                position_source = state[16]  # 0=ADS-B, 1=MLAT, 2=Other
                
                # Skip if no position
                if lat is None or lon is None or alt_ft is None:
                    continue
                
                # Convert units
                alt_ft = int(alt_ft * 3.28084)  # meters to feet
                speed_kts = int(speed_kts * 1.94384) if speed_kts else None  # m/s to knots
                
                # Determine if cooperative (ADS-B) vs MLAT only
                is_cooperative = position_source == 0  # 0 = ADS-B
                
                aircraft = {
                    'icao': icao.upper(),
                    'callsign': callsign,
                    'lat': lat,
                    'lon': lon,
                    'alt_ft': alt_ft,
                    'speed_kts': speed_kts,
                    'heading': heading,
                    'confidence': 0.95 if is_cooperative else 0.75,  # Higher confidence for ADS-B
                    'cooperative': is_cooperative,
                    'sensor_count': 1 if is_cooperative else 3,  # MLAT needs multiple sensors
                    'is_ghost': False,
                    'color': '#3DDC97' if is_cooperative else '#FFB020',
                    'type': self._get_aircraft_type(state[17]) if len(state) > 17 else 'UNKN',
                    'origin_country': state[2] if len(state) > 2 else '',
                    'position_source': position_source,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                aircraft_list.append(aircraft)
                
            except (IndexError, TypeError, ValueError) as e:
                logger.warning(f"Error parsing aircraft state: {e}")
                continue
        
        return aircraft_list
    
    def _get_aircraft_type(self, category: Optional[int]) -> str:
        """Convert OpenSky category to aircraft type"""
        if not category:
            return 'UNKN'
            
        type_mapping = {
            0: 'UNKN',    # No information
            1: 'LJET',    # Light aircraft
            2: 'SMAL',    # Small aircraft
            3: 'LJET',    # Large aircraft
            4: 'HJET',    # Heavy aircraft
            5: 'LJET',    # Light rotorcraft
            6: 'HJET',    # Heavy rotorcraft
            7: 'UNKN',    # Glider/sailplane
            8: 'UNKN',    # Lighter-than-air
            9: 'UNKN',    # Parachutist/skydiver
            10: 'ULTR',   # Ultralight/hang-glider/paraglider
            11: 'UNKN',    # Reserved
            12: 'UNKN',    # Unmanned aerial vehicle
            13: 'UNKN',    # Space/Trans-atmospheric vehicle
            14: 'UNKN',    # Surface vehicle - emergency vehicle
            15: 'UNKN',    # Surface vehicle - service vehicle
            16: 'UNKN',    # Point obstacle
            17: 'UNKN',    # Cluster obstacle
            18: 'UNKN',    # Line obstacle
        }
        
        return type_mapping.get(category, 'UNKN')

# Global instance
flight_tracker = FlightTrackingService()

async def get_real_time_aircraft(bbox: Optional[List[float]] = None) -> List[Dict[str, Any]]:
    """
    Get real-time aircraft data in MLAT format
    
    Args:
        bbox: [lat_min, lon_min, lat_max, lon_max] bounding box
        
    Returns:
        List of aircraft in MLAT format
    """
    async with flight_tracker:
        opensky_data = await flight_tracker.get_all_aircraft(bbox)
        return flight_tracker.convert_to_mlat_format(opensky_data)

# Example usage
if __name__ == "__main__":
    async def test():
        aircraft = await get_real_time_aircraft()
        print(f"Found {len(aircraft)} aircraft")
        for ac in aircraft[:5]:  # Show first 5
            print(f"{ac['icao']} ({ac['callsign']}) - {ac['lat']:.4f}, {ac['lon']:.4f} - {ac['alt_ft']}ft")
    
    asyncio.run(test())
