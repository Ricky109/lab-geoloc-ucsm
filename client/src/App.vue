<template>
  <div class="container">
    <h2>Consulta de Geolocalización OpenStreetMap</h2>

    <div id="map" style="height: 400px; width: 100%; margin-bottom: 20px; border-radius: 8px;"></div>
    
    <p style="text-align: center; color: #666;">
      {{ selectionMode === 'origin' ? '📍 Haz clic para marcar el ORIGEN' : '🏁 Haz clic para marcar el DESTINO' }}
    </p>

    <div class="forms-row">
      <fieldset>
        <legend>Origen</legend>
        Lat: <input v-model="form.oLat" readonly /> 
        Lon: <input v-model="form.oLon" readonly />
        <p><strong>Dirección:</strong> {{ direcciones.origen }}</p>
      </fieldset>

      <fieldset>
        <legend>Destino</legend>
        Lat: <input v-model="form.dLat" readonly /> 
        Lon: <input v-model="form.dLon" readonly />
        <p><strong>Dirección:</strong> {{ direcciones.destino }}</p>
      </fieldset>
    </div>

    <button @click="consultar" :disabled="loading">
      {{ loading ? 'Consultando...' : 'Calcular Ruta' }}
    </button>

    <div v-if="resultados.distancia" class="results">
      <p>Distancia: <strong>{{ resultados.distancia }} km</strong> [cite: 139]</p>
      <p>Tiempo estimado: <strong>{{ resultados.tiempo }} min</strong> [cite: 139]</p>
    </div>

    <p style="font-size:0.8em; color:#888; margin-top: 20px;">
      Datos <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>
    </p>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import L from 'leaflet';
import api from './api';
import 'leaflet/dist/leaflet.css';

const form = reactive({ oLat: '', oLon: '', dLat: '', dLon: '' });
const direcciones = reactive({ origen: '', destino: '' });
const resultados = reactive({ distancia: '', tiempo: '' });
const loading = ref(false);
const selectionMode = ref('origin'); // Alterna entre origin y destination

let map, markerO, markerD;

onMounted(() => {
  // Inicializar mapa centrado en Arequipa [cite: 53]
  map = L.map('map').setView([-16.409, -71.537], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Evento de clic en el mapa
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    
    if (selectionMode.value === 'origin') {
      form.oLat = lat.toFixed(6);
      form.oLon = lng.toFixed(6);
      if (markerO) markerO.setLatLng(e.latlng);
      else markerO = L.marker(e.latlng).addTo(map).bindPopup("Origen").openPopup();
      selectionMode.value = 'destination';
    } else {
      form.dLat = lat.toFixed(6);
      form.dLon = lng.toFixed(6);
      if (markerD) markerD.setLatLng(e.latlng);
      else markerD = L.marker(e.latlng, { icon: L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] }) }).addTo(map).bindPopup("Destino").openPopup();
      selectionMode.value = 'origin';
    }
  });
});

const consultar = async () => {
  if (!form.oLat || !form.dLat) return alert("Selecciona ambos puntos en el mapa");
  loading.value = true;
  try {
    const [resO, resD] = await Promise.all([
      api.get(`/geocode?lat=${form.oLat}&lon=${form.oLon}`), 
      api.get(`/geocode?lat=${form.dLat}&lon=${form.dLon}`) 
    ]);
    direcciones.origen = resO.data.direccion; 
    direcciones.destino = resD.data.direccion; 

    const resRuta = await api.get(`/ruta`, { 
      params: { oLat: form.oLat, oLon: form.oLon, dLat: form.dLat, dLon: form.dLon } 
    });
    
    resultados.distancia = resRuta.data.distancia_km; 
    resultados.tiempo = resRuta.data.duracion_min; 
  } catch (error) {
    alert("Error: " + error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.container { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: auto; padding: 20px; }
.forms-row { display: flex; gap: 20px; margin-bottom: 20px; }
fieldset { flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
input { width: 90%; margin-top: 5px; background: #f9f9f9; border: 1px solid #ccc; padding: 5px; }
button { width: 100%; padding: 12px; font-weight: bold; background: #2ecc71; color: white; border: none; border-radius: 6px; cursor: pointer; }
.results { margin-top: 20px; background: #eef9f3; padding: 15px; border-radius: 8px; border-left: 5px solid #2ecc71; }
</style>
