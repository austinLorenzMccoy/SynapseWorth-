'use client';

import { useEffect, useRef, useState } from 'react';
import { getLondonFlights, getFlightStats, Aircraft } from '../../lib/flight_tracking';

function svgIcon(color:string,heading:number,ghost:boolean){
  const pulse=ghost?`<circle cx="16" cy="16" r="5" fill="${color}" opacity="0.35"><animate attributeName="r" values="5;13;5" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/></circle>`:'';
  const ring=ghost?`<circle cx="16" cy="16" r="13" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.45"/>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 32 32">${pulse}<g transform="rotate(${heading},16,16)"><path d="M16 3L18.5 13L29 17.5L29 20L18.5 17.5L17.5 26L21 27.5L21 29L16 27.5L11 29L11 27.5L14.5 26L13.5 17.5L3 20L3 17.5L13.5 13Z" fill="${color}" opacity="0.92"/></g>${ring}</svg>`;
}

function popup(ac:Aircraft){
  const c=ac.color??(ac.cooperative?'#3DDC97':'#FF4444'),p=Math.round(ac.confidence*100),b=p>=85?'#3DDC97':p>=65?'#FFB020':'#FF4444';
  return `<div style="background:#0D1117;border:1px solid ${c}44;border-radius:8px;padding:12px 14px;min-width:210px;font-family:'Courier New',monospace;color:#E6EAF0;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span style="background:${c}22;color:${c};border:1px solid ${c}55;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold;">${ac.cooperative?'● ADS-B':'◌ MLAT ONLY'}</span>${ac.type?`<span style="color:#555;font-size:10px;">${ac.type}</span>`:''}</div>
    <div style="font-size:15px;font-weight:bold;color:${c};margin-bottom:8px;">${ac.icao}${ac.callsign?` · ${ac.callsign}`:''}</div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:11px;margin-bottom:8px;">
      <span style="color:#666;">ALT</span><span>${ac.alt_ft.toLocaleString()} ft</span>
      ${ac.speed_kts?`<span style="color:#666;">SPD</span><span>${ac.speed_kts} kts</span>`:''}
      <span style="color:#666;">CONF</span><span style="color:${b}">${p}%</span>
      <span style="color:#666;">METHOD</span><span style="color:#3DDC97;">${ac.cooperative?'ADS-B+MLAT':'TDOA/MLAT'}</span>
    </div>
    <div style="height:3px;background:#1a1a2e;border-radius:2px;overflow:hidden;margin-bottom:8px;"><div style="height:100%;width:${p}%;background:${b};"></div></div>
    ${!ac.cooperative?`<div style="padding:5px 8px;background:#FF444411;border:1px solid #FF444433;border-radius:4px;font-size:10px;color:#FF8888;margin-bottom:6px;">⚠ Non-cooperative · No transponder</div>`:''}
    <div style="padding:4px 6px;background:#3DDC9711;border-radius:4px;font-size:9px;color:#3DDC9799;">HCS: 0.0.7968510</div>
    ${ac.origin_country?`<div style="margin-top:4px;font-size:9px;color:#888;">🌍 ${ac.origin_country}</div>`:''}
    ${ac.timestamp?`<div style="margin-top:2px;font-size:9px;color:#888;">📡 ${new Date(ac.timestamp).toLocaleTimeString()}</div>`:''}
  </div>`;
}

function mark(L:any,map:any,ac:Aircraft){
  const m=L.marker([ac.lat,ac.lon],{
    icon:L.divIcon({
      html:`<div style="transform:translate(-50%,-50%);">${svgIcon(ac.color??'#3DDC97',ac.heading??0,ac.is_ghost??false)}</div>`,
      className:'',
      iconSize:[36,36],
      iconAnchor:[18,18]
    })
  });
  m.bindPopup(popup(ac));
  m.addTo(map);
  return m;
}

export default function MLATPage(){
  const elRef=useRef<HTMLDivElement>(null);
  const mapRef=useRef<any>(null);
  const markersRef=useRef<Map<string,any>>(new Map());

  // Real-time aircraft state
  const [realtimeAircraft, setRealtimeAircraft] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const [list,setList]=useState<Aircraft[]>([]);
  const [sel,setSel]=useState<Aircraft|null>(null);
  const [q,setQ]=useState('');
  const [reply,setReply]=useState('');
  const [loading,setLoading]=useState(false);

  // Fetch real-time aircraft data using frontend service
  const fetchRealtimeAircraft = async () => {
    try {
      setIsLoading(true);
      const data = await getLondonFlights(100);
      
      setRealtimeAircraft(data.aircraft);
      setList(data.aircraft);
      setLastUpdate(data.last_updated);
      
      // Update map markers
      if (mapRef.current) {
        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current.clear();
        
        // Add new markers
        data.aircraft.forEach((ac: Aircraft) => {
          const marker = mark(window.L, mapRef.current, ac);
          markersRef.current.set(ac.icao, marker);
        });
      }
    } catch (error) {
      console.error('Error fetching real-time aircraft:', error);
      setReply('Failed to fetch real-time flight data from OpenSky Network');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchRealtimeAircraft(); // Initial fetch
    const interval = setInterval(fetchRealtimeAircraft, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(()=>{
    if(mapRef.current||!elRef.current)return;
    if(!document.getElementById('lf-css')){const l=document.createElement('link');l.id='lf-css';l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(l);}

    import('leaflet').then(L=>{
      if(mapRef.current||!elRef.current)return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete(L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'});
      const map=L.map(elRef.current!,{center:[51.5,-0.8],zoom:9,zoomControl:true,attributionControl:false});
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19}).addTo(map);
      mapRef.current=map;
    });
  }, []);

  const filtered = list.filter(a=>!q||a.icao.toLowerCase().includes(q.toLowerCase())||a.callsign?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{display:'flex',height:'100vh',background:'#0D1117',fontFamily:'system-ui,sans-serif'}}>
      <div style={{flex:1,position:'relative'}}>
        <div ref={elRef} style={{width:'100%',height:'100%'}}/>
        <div style={{position:'absolute',top:12,left:12,background:'#0D1117dd',border:'1px solid #30363d',borderRadius:8,padding:12,fontSize:12,color:'#E6EAF0',zIndex:1000}}>
          <div style={{fontWeight:600,marginBottom:4,color:'#3DDC97'}}>🛩️ Real-Time Flight Tracking</div>
          <div style={{fontSize:11,color:'#888'}}>
            {isLoading ? '🔄 Loading...' : `✅ ${list.length} aircraft`}
          </div>
          {lastUpdate && (
            <div style={{fontSize:10,color:'#666',marginTop:2}}>
              📡 {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
          <div style={{fontSize:10,color:'#666',marginTop:4}}>
            🔗 OpenSky Network (Direct API)
          </div>
          <div style={{fontSize:10,color:'#3DDC97',marginTop:2}}>
            🚀 No Backend Required
          </div>
        </div>
      </div>
      
      <div style={{width:380,background:'#161B22',borderLeft:'1px solid #30363d',display:'flex',flexDirection:'column'}}>
        <div style={{padding:16,borderBottom:'1px solid #30363d'}}>
          <div style={{fontSize:18,fontWeight:600,color:'#E6EAF0',marginBottom:8}}>AircraftWorth MLAT</div>
          <input
            placeholder="Search ICAO or callsign..."
            value={q}
            onChange={e=>setQ(e.target.value)}
            style={{
              width:'100%',padding:'8px 12px',background:'#0D1117',border:'1px solid #30363d',
              borderRadius:6,color:'#E6EAF0',fontSize:14,outline:'none'
            }}
          />
        </div>
        
        <div style={{flex:1,overflowY:'auto',padding:12}}>
          {filtered.length===0?(
            <div style={{textAlign:'center',color:'#666',marginTop:40}}>
              {isLoading ? '🔄 Loading real-time data...' : '✈️ No aircraft found'}
            </div>
          ):(
            filtered.map(a=>(
              <div
                key={a.icao}
                onClick={()=>setSel(a)}
                style={{
                  background:sel?.icao===a.icao?'#1C2128':'transparent',
                  border:`1px solid ${sel?.icao===a.icao?(a.color??'#3DDC97'):'#30363d'}`,
                  borderRadius:8,padding:12,marginBottom:8,cursor:'pointer',
                  transition:'all 0.2s'
                }}
              >
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{
                    background:(a.color??'#3DDC97')+'22',color:(a.color??'#3DDC97'),
                    border:`1px solid ${(a.color??'#3DDC97')}55`,padding:'2px 8px',
                    borderRadius:4,fontSize:10,fontWeight:'bold'
                  }}>
                    {a.cooperative?'● ADS-B':'◌ MLAT'}
                  </span>
                  {a.type && <span style={{color:'#666',fontSize:10}}>{a.type}</span>}
                </div>
                <div style={{fontSize:15,fontWeight:600,color:(a.color??'#3DDC97'),marginBottom:4}}>
                  {a.icao}{a.callsign?` · ${a.callsign}`:''}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'2px 8px',fontSize:11,color:'#888'}}>
                  <span>ALT</span><span>{a.alt_ft.toLocaleString()} ft</span>
                  {a.speed_kts && <><span>SPD</span><span>{a.speed_kts} kts</span></>}
                  <span>CONF</span><span style={{color:Math.round(a.confidence*100)>=85?'#3DDC97':Math.round(a.confidence*100)>=65?'#FFB020':'#FF4444'}}>{Math.round(a.confidence*100)}%</span>
                </div>
                {a.origin_country && (
                  <div style={{fontSize:10,color:'#666',marginTop:4}}>🌍 {a.origin_country}</div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div style={{padding:16,borderTop:'1px solid #30363d'}}>
          <div style={{fontSize:12,color:'#888',marginBottom:8}}>
            {reply || 'Real-time aircraft tracking powered by OpenSky Network (Direct API)'}
          </div>
          <button
            onClick={fetchRealtimeAircraft}
            disabled={loading}
            style={{
              width:'100%',padding:'8px',background:'#3DDC97',border:'none',
              borderRadius:6,color:'#0D1117',fontWeight:600,cursor:loading?'not-allowed':'pointer'
            }}
          >
            {loading?'🔄 Refreshing...':'🔄 Refresh Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
