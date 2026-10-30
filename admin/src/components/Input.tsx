import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngTuple, LeafletMouseEvent } from 'leaflet';
import PluginIcon from './../components/PluginIcon';
import { version } from './../../../package.json';
import { useQueryParams } from '@strapi/strapi/admin';
import { buildValidParams, unstable_useContentManagerContext as useContentManagerContext,
  unstable_useDocument as useDocument, useDocumentRBAC } from '@strapi/content-manager/strapi-admin';

import {
  Box,
  Typography,
  Loader,
  JSONInput,
  TextInput,
  Field,
  Button,
} from '@strapi/design-system';

import 'leaflet/dist/leaflet.css';


const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';


const customIcon = new L.Icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
  shadowUrl: shadowUrl,
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

interface Location {
  lat: number;
  lng: number;
}

interface InputProps {
  value: Location;
  [key: string]: any;
}

const mapProps = {
  zoom: 7,
  center: [41.9, 12.5] as LatLngTuple,
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  tileAccessToken: '',
};

const Input: React.FC<InputProps> = (props) => {
  const { model, form, id, collectionType } = useContentManagerContext() as any;
  const [{ query }] = useQueryParams<Parameters<typeof buildValidParams>[0]>();
  const params = buildValidParams(query);
  const { document } = useDocument({ model, collectionType, documentId: id, params });
  const formKey = `${model}:${id || 'new'}:${params?.locale || ''}:${params?.status || 'draft'}`;
  const activeForm = useRef<string | null>(formKey);
  activeForm.current = formKey;
  const { canCreateFields, canUpdateFields, canUserAction } = useDocumentRBAC('GeodataInput', state => state);
  const [map, setMap] = useState<any>(null);
  const [location, setLocation] = useState<any>(props.value);

  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    activeForm.current = formKey;
    return () => { activeForm.current = null; };
  }, [formKey]);

  useEffect(() => {
    const next = props.value;
    if (next?.lat === location?.lat && next?.lng === location?.lng) return;
    setLocation(next);
    if (map && next && Number.isFinite(next.lat) && Number.isFinite(next.lng)) map.panTo(next);
  }, [props.value?.lat, props.value?.lng, map]);

  // Only direct Geodata actions supply manual provenance. Native form resets/copies do not.
  const setManualLocation = useCallback((next: Location) => {
    const managed = model === 'api::entity.entity' && props.name === 'coordinates';
    if (managed && (activeForm.current !== formKey || props.disabled || form?.disabled)) return false;
    setLocation(next);
    if (!managed || !Number.isFinite(next.lat) || !Number.isFinite(next.lng)) return true;
    const fields = document?.documentId ? canUpdateFields : canCreateFields;
    const change = (name: string, value: any, type: 'json' | 'component' | 'string') => {
      if (canUserAction(name, fields, type)) form.onChange({ target: { name, value, type } });
    };
    change('coordinateMetadata', {
      raw: { coordinates: { lat: next.lat, lng: next.lng }, crs: 'WGS84' },
      wgs84Coordinates: { lat: next.lat, lng: next.lng },
      source: { provider: 'unknown', url: null }, _intent: 'set',
    }, 'json');
    const url = `https://www.google.com/maps/search/?api=1&query=${next.lat},${next.lng}`;
    change('mapUrls', [{ url }], 'component');
    change('googleMapURL', url, 'string');
    return true;
  }, [model, formKey, props.name, props.disabled, form?.disabled, document?.documentId,
    form?.onChange, canCreateFields, canUpdateFields, canUserAction]);

  const onMapClick = useCallback(
    (e: LeafletMouseEvent) => {
      setManualLocation(e.latlng);
    },
    [setManualLocation]
  );

  useEffect(() => {
    if (!map) return;
    map.on('contextmenu', onMapClick);
    return () => {
      map.off('contextmenu', onMapClick);
    };
  }, [map, onMapClick]);

  useEffect(() => {
    props.onChange({
      target: {
        name: props.name,
        value: location,
        type: props.attribute.type,
      },
    });
  }, [location]);

  async function searchLocation(e: React.MouseEvent) {
    let search = searchRef.current?.value;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${search}&format=json`
    );
    const data = await response.json();
    if (data.length > 0) {
      let lat = parseFloat(data[0].lat);
      let lng = parseFloat(data[0].lon);
      if (setManualLocation({ lat, lng })) map.panTo({ lat, lng });
    }
  }

  async function setLatLng() {
    let lat: any = latRef.current?.value;
    let lng: any = lngRef.current?.value;
    if (lat && lng) {
      lat = parseFloat(lat);
      lng = parseFloat(lng);
      if (setManualLocation({ lat, lng })) map.panTo({ lat, lng });
    }
  }

  function handleKeyPress(event: any) {
    if (event?.key === 'Enter') {
      console.log('enter press here! ');
    }
  }

  const marginBottom = '2rem';
  const display = 'block';

  return (
    <Box>
      <Typography variant="omega" style={{ marginBottom, display }}>
        To set the location, enter the coordinates and click on 'Set Location', or search for an
        address and press 'Search', or navigate on the map and right-click
      </Typography>

      <Box style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', marginBottom }}>
        <TextInput ref={latRef} name="lat" placeholder="Latitude" />
        <TextInput ref={lngRef} name="lng" placeholder="Longitude" />
        <Button variant="secondary" onClick={setLatLng} size="L">
          Set Location
        </Button>
      </Box>

      <Box style={{ display: 'grid', gridTemplateColumns: '4fr 1fr', marginBottom }}>
        <TextInput ref={searchRef} name="search" placeholder="Address to search" />
        <Button variant="secondary" onClick={searchLocation} size="L">
          Search
        </Button>
      </Box>

      <Box style={{ display: 'flex', height: '300px', width: '100%', marginBottom }}>
        <Box style={{ width: '100% ' }}>
          <MapContainer
            zoom={mapProps.zoom}
            center={props.value?.lat && props.value?.lng ? [props.value?.lat, props.value?.lng] : mapProps.center as LatLngTuple}
            ref={setMap}
            style={{ height: '300px', zIndex: 299 }}
          >
            <TileLayer
              attribution={mapProps.tileAttribution}
              url={mapProps.tileUrl}
              accessToken={mapProps.tileAccessToken}
              referrerPolicy="strict-origin"
              crossOrigin="anonymous"
            />
            {location && <Marker position={[location?.lat, location?.lng]} icon={customIcon} />}
          </MapContainer>
        </Box>
      </Box>

      <Box style={{ marginBottom }}>
        <Typography variant="delta" style={{ marginBottom, display }}>
          Current {props.label} value:
        </Typography>

        <JSONInput
          disabled
          name={props.name}
          value={JSON.stringify(props.value, null, 2)}
          onChange={(e: any) => setLocation(e)}
          style={{ height: '9rem' }}
        />
      </Box>
    </Box>
  );
};

export default Input;
