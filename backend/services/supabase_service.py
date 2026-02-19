import os
from typing import Any, Dict, List, Optional

from supabase import Client, create_client

from models import AircraftPosition, ModeSMessage, SensorMetadata


class SupabaseService:
    """Lightweight wrapper around Supabase REST APIs used for MLAT storage."""

    def __init__(self) -> None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")

        if not url or not key:
            self.client = None
        else:
            self.client = create_client(url, key)

    def _ensure_client(self) -> Client:
        if not self.client:
            raise RuntimeError("Supabase client is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.")
        return self.client

    # ------------------------------------------------------------------
    # Mode-S messages
    # ------------------------------------------------------------------
    def store_mode_s_message(self, message: ModeSMessage) -> Dict[str, Any]:
        client = self._ensure_client()
        payload = {
            "sensor_id": message.sensorId,
            "icao_address": message.icaoAddress,
            "raw_message": message.rawMessage,
            "timestamp_ns": message.timestampNs,
            "sensor_lat": message.sensorLocation.latitude,
            "sensor_lon": message.sensorLocation.longitude,
            "sensor_alt_m": message.sensorLocation.altitudeMeters,
        }
        response = client.table("mode_s_messages").insert(payload).execute()
        return response.data[0] if response.data else {}

    def batch_store_mode_s_messages(self, messages: List[ModeSMessage]) -> int:
        client = self._ensure_client()
        if not messages:
            return 0
        payload = [
            {
                "sensor_id": message.sensorId,
                "icao_address": message.icaoAddress,
                "raw_message": message.rawMessage,
                "timestamp_ns": message.timestampNs,
                "sensor_lat": message.sensorLocation.latitude,
                "sensor_lon": message.sensorLocation.longitude,
                "sensor_alt_m": message.sensorLocation.altitudeMeters,
            }
            for message in messages
        ]
        response = client.table("mode_s_messages").insert(payload).execute()
        return len(response.data or [])

    def fetch_recent_messages(self, icao_address: str, time_window_ms: int) -> List[Dict[str, Any]]:
        client = self._ensure_client()
        response = (
            client.table("mode_s_messages")
            .select("*")
            .eq("icao_address", icao_address)
            .order("timestamp_ns", desc=True)
            .limit(512)
            .execute()
        )
        messages = response.data or []
        if not messages:
            return []

        newest = messages[0]["timestamp_ns"]
        cutoff = newest - (time_window_ms * 1_000_000)
        return [msg for msg in messages if msg["timestamp_ns"] >= cutoff]

    # ------------------------------------------------------------------
    # Aircraft positions
    # ------------------------------------------------------------------
    def store_aircraft_position(self, position: AircraftPosition) -> Dict[str, Any]:
        client = self._ensure_client()
        payload = {
            "icao_address": position.icaoAddress,
            "latitude": position.latitude,
            "longitude": position.longitude,
            "altitude_ft": position.altitudeFt,
            "confidence_score": position.confidenceScore,
            "sensor_count": position.sensorCount,
            "calculation_method": position.calculationMethod,
            "hedera_sequence_number": position.hederaSequenceNumber,
            "flight_track_token_id": position.flightTrackTokenId,
        }
        response = client.table("aircraft_positions").insert(payload).execute()
        return response.data[0] if response.data else {}

    def get_recent_positions(self, minutes: int = 10) -> List[Dict[str, Any]]:
        client = self._ensure_client()
        response = (
            client.table("aircraft_positions")
            .select("*")
            .gte("calculated_at", f"now() - interval '{minutes} minutes'")
            .order("calculated_at", desc=True)
            .execute()
        )
        return response.data or []

    # ------------------------------------------------------------------
    # Sensor metadata
    # ------------------------------------------------------------------
    def upsert_sensor_metadata(self, sensor: SensorMetadata) -> Dict[str, Any]:
        client = self._ensure_client()
        payload = {
            "sensor_id": sensor.sensorId,
            "hedera_account_id": sensor.hederaAccountId,
            "name": sensor.name,
            "location": f"POINT({sensor.location.longitude} {sensor.location.latitude})",
            "last_heartbeat": sensor.lastHeartbeat,
        }
        response = client.table("sensors").upsert(payload).execute()
        return response.data[0] if response.data else {}

    def get_active_sensors(self, minutes: int = 5) -> List[Dict[str, Any]]:
        client = self._ensure_client()
        response = (
            client.table("sensors")
            .select("*")
            .gte("last_heartbeat", f"now() - interval '{minutes} minutes'")
            .execute()
        )
        return response.data or []

    # ------------------------------------------------------------------
    # Utility helpers
    # ------------------------------------------------------------------
    @property
    def is_configured(self) -> bool:
        return self.client is not None

    def health_check(self) -> Dict[str, Any]:
        return {
            "supabase_configured": self.is_configured,
        }
