/**
 * Real-time flight tracking using OpenSky Network API
 * Direct frontend implementation for hackathon demo
 */

export interface Aircraft {
  icao: string;
  callsign?: string;
  lat: number;
  lon: number;
  alt_ft: number;
  speed_kts?: number;
  heading?: number;
  confidence: number;
  cooperative: boolean;
  sensor_count?: number;
  is_ghost?: boolean;
  color?: string;
  type?: string;
  origin_country?: string;
  position_source?: number;
  timestamp?: string;
}

export interface FlightDataResponse {
  aircraft: Aircraft[];
  total_count: number;
  area_covered: string;
  last_updated: string;
  data_source: string;
}

class FlightTrackingService {
  private readonly OPENSKY_API = "https://opensky-network.org/api";
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Get real-time aircraft data from OpenSky Network
   */
  async getRealtimeFlights(
    lat_min: number = 51.0,
    lon_min: number = -1.0,
    lat_max: number = 52.0,
    lon_max: number = 0.0,
    limit: number = 100
  ): Promise<FlightDataResponse> {
    const cacheKey = `flights_${lat_min}_${lon_min}_${lat_max}_${lon_max}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const params = new URLSearchParams({
        lamin: lat_min.toString(),
        lomin: lon_min.toString(),
        lamax: lat_max.toString(),
        lomax: lon_max.toString()
      });

      const response = await fetch(
        `${this.OPENSKY_API}/states/all?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`OpenSky API error: ${response.status}`);
      }

      const data = await response.json();
      const aircraft = this.convertToAircraftFormat(data.states || []);

      // Limit results
      const limitedAircraft = aircraft.slice(0, limit);

      const result: FlightDataResponse = {
        aircraft: limitedAircraft,
        total_count: limitedAircraft.length,
        area_covered: `${lat_min.toFixed(2)},${lon_min.toFixed(2)} to ${lat_max.toFixed(2)},${lon_max.toFixed(2)}`,
        last_updated: new Date().toISOString(),
        data_source: "OpenSky Network"
      };

      // Cache the result
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;

    } catch (error) {
      console.error('Error fetching flight data:', error);
      // Return cached data if available, even if expired
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Get London area flights (convenience method)
   */
  async getLondonFlights(limit: number = 50): Promise<FlightDataResponse> {
    return this.getRealtimeFlights(51.0, -1.0, 52.0, 0.0, limit);
  }

  /**
   * Convert OpenSky state vectors to Aircraft format
   */
  private convertToAircraftFormat(states: any[][]): Aircraft[] {
    const aircraft: Aircraft[] = [];

    // OpenSky state vector format:
    // [0] icao24, [1] callsign, [2] origin_country, [3] time_position,
    // [4] time_velocity, [5] longitude, [6] latitude, [7] geo_altitude,
    // [8] on_ground, [9] velocity, [10] heading, [11] vertical_rate,
    // [12] sensors, [13] baro_altitude, [14] squawk, [15] emergency,
    // [16] position_source, [17] category

    for (const state of states) {
      try {
        const [
          icao,
          callsign,
          origin_country,
          time_position,
          time_velocity,
          longitude,
          latitude,
          geo_altitude,
          on_ground,
          velocity,
          heading,
          vertical_rate,
          sensors,
          baro_altitude,
          squawk,
          emergency,
          position_source,
          category
        ] = state;

        // Skip if no position
        if (latitude === null || longitude === null || geo_altitude === null) {
          continue;
        }

        // Convert units
        const alt_ft = Math.round(geo_altitude * 3.28084); // meters to feet
        const speed_kts = velocity ? Math.round(velocity * 1.94384) : undefined; // m/s to knots

        // Determine if cooperative (ADS-B) vs MLAT only
        const is_cooperative = position_source === 0; // 0 = ADS-B

        const aircraft_data: Aircraft = {
          icao: icao.toUpperCase(),
          callsign: callsign?.trim() || undefined,
          lat: latitude,
          lon: longitude,
          alt_ft: alt_ft,
          speed_kts: speed_kts,
          heading: heading,
          confidence: is_cooperative ? 0.95 : 0.75, // Higher confidence for ADS-B
          cooperative: is_cooperative,
          sensor_count: is_cooperative ? 1 : 3, // MLAT needs multiple sensors
          is_ghost: false,
          color: is_cooperative ? '#3DDC97' : '#FFB020',
          type: this.getAircraftType(category),
          origin_country: origin_country || undefined,
          position_source: position_source,
          timestamp: new Date().toISOString()
        };

        aircraft.push(aircraft_data);

      } catch (error) {
        console.warn('Error parsing aircraft state:', error);
        continue;
      }
    }

    return aircraft;
  }

  /**
   * Convert OpenSky category to aircraft type
   */
  private getAircraftType(category?: number): string {
    if (!category) return 'UNKN';

    const typeMapping: { [key: number]: string } = {
      0: 'UNKN',    // No information
      1: 'LJET',    // Light aircraft
      2: 'SMAL',    // Small aircraft
      3: 'LJET',    // Large aircraft
      4: 'HJET',    // Heavy aircraft
      5: 'LJET',    // Light rotorcraft
      6: 'HJET',    // Heavy rotorcraft
      7: 'UNKN',    // Glider/sailplane
      8: 'UNKN',    // Lighter-than-air
      9: 'UNKN',    // Parachutist/skydiver
      10: 'ULTR',   // Ultralight/hang-glider/paraglider
      11: 'UNKN',    // Reserved
      12: 'UNKN',    // Unmanned aerial vehicle
      13: 'UNKN',    // Space/Trans-atmospheric vehicle
      14: 'UNKN',    // Surface vehicle - emergency vehicle
      15: 'UNKN',    // Surface vehicle - service vehicle
      16: 'UNKN',    // Point obstacle
      17: 'UNKN',    // Cluster obstacle
      18: 'UNKN',    // Line obstacle
    };

    return typeMapping[category] || 'UNKN';
  }

  /**
   * Get flight statistics
   */
  async getFlightStats(): Promise<any> {
    try {
      const data = await this.getLondonFlights(100);
      const aircraft = data.aircraft;

      // Calculate statistics
      const totalAircraft = aircraft.length;
      const adsBAircraft = aircraft.filter(ac => ac.cooperative).length;
      const mlatAircraft = totalAircraft - adsBAircraft;

      // Altitude distribution
      const altRanges = {
        ground: aircraft.filter(ac => ac.alt_ft < 1000).length,
        low: aircraft.filter(ac => ac.alt_ft >= 1000 && ac.alt_ft < 10000).length,
        medium: aircraft.filter(ac => ac.alt_ft >= 10000 && ac.alt_ft < 25000).length,
        high: aircraft.filter(ac => ac.alt_ft >= 25000).length
      };

      // Top countries
      const countries: { [key: string]: number } = {};
      aircraft.forEach(ac => {
        const country = ac.origin_country || 'Unknown';
        countries[country] = (countries[country] || 0) + 1;
      });

      const topCountries = Object.entries(countries)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([country, count]) => ({ country, count }));

      return {
        total_aircraft: totalAircraft,
        ads_b_aircraft: adsBAircraft,
        mlat_aircraft: mlatAircraft,
        cooperative_rate: totalAircraft > 0 ? `${(adsBAircraft / totalAircraft * 100).toFixed(1)}%` : '0%',
        altitude_distribution: altRanges,
        top_countries: topCountries,
        data_source: "OpenSky Network",
        last_updated: data.last_updated,
        coverage_area: "London Area (51.0,-1.0 to 52.0,0.0)"
      };

    } catch (error) {
      console.error('Error getting flight stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const flightTracker = new FlightTrackingService();

// Export convenience functions
export const getRealtimeFlights = (params?: {
  lat_min?: number;
  lon_min?: number;
  lat_max?: number;
  lon_max?: number;
  limit?: number;
}) => flightTracker.getRealtimeFlights(
  params?.lat_min,
  params?.lon_min,
  params?.lat_max,
  params?.lon_max,
  params?.limit
);

export const getLondonFlights = (limit?: number) => flightTracker.getLondonFlights(limit);
export const getFlightStats = () => flightTracker.getFlightStats();
