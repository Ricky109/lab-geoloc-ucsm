<template>
  <div class="container">
    <h2>Consulta de Geolocalización OpenStreetMap</h2>

    <fieldset>
      <legend>Origen</legend>
      Lat: <input v-model="form.oLat" placeholder="-16.414005" />
      Lon: <input v-model="form.oLon" placeholder="-71.515773" />
      <p><strong>Dirección:</strong> {{ direcciones.origen }}</p>
    </fieldset>

    <fieldset>
      <legend>Destino</legend>
      Lat: <input v-model="form.dLat" placeholder="-16.406547" />
      Lon: <input v-model="form.dLon" placeholder="-71.553179" />
      <p><strong>Dirección:</strong> {{ direcciones.destino }}</p>
    </fieldset>

    <button @click="consultar" :disabled="loading">
      {{ loading ? 'Consultando...' : 'Consultar' }}
    </button>

    <div v-if="resultados.distancia">
      <p>Distancia: <span>{{ resultados.distancia }}</span> km</p>
      <p>Tiempo estimado: <span>{{ resultados.tiempo }}</span> min</p>
    </div>

    <p style="font-size:0.8em; color:#888; margin-top: 20px;">
      Datos <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a> [cite: 174]
    </p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import api from './api';

// Datos reactivos basados en la nomenclatura del lab 
const form = reactive({
  oLat: '-16.414005',
  oLon: '-71.515773',
  dLat: '-16.406547',
  dLon: '-71.553179'
});

const direcciones = reactive({ origen: '', destino: '' });
const resultados = reactive({ distancia: '', tiempo: '' });
const loading = ref(false);

const consultar = async () => {
  loading.value = true;
  try {
    // 1. Obtener direcciones (Geocodificación Inversa) [cite: 107]
    const [resO, resD] = await Promise.all([
      api.get(`/geocode?lat=${form.oLat}&lon=${form.oLon}`),
      api.get(`/geocode?lat=${form.dLat}&lon=${form.dLon}`)
    ]);
    direcciones.origen = resO.data.direccion;
    direcciones.destino = resD.data.direccion;

    // 2. Obtener Ruta (OSRM) [cite: 125]
    const resRuta = await api.get(`/ruta`, { 
      params: { oLat: form.oLat, oLon: form.oLon, dLat: form.dLat, dLon: form.dLon } 
    });
    
    resultados.distancia = resRuta.data.distancia_km;
    resultados.tiempo = resRuta.data.duracion_min;
  } catch (error) {
    alert("Error al consultar el servicio: " + error.message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.container { font-family: sans-serif; max-width: 600px; margin: auto; }
fieldset { margin-bottom: 15px; padding: 10px; border: 1px solid #ccc; }
input { margin-right: 10px; margin-bottom: 5px; }
button { padding: 10px 20px; cursor: pointer; background: #42b983; color: white; border: none; border-radius: 4px; }
button:disabled { background: #ccc; }
</style>
