import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { query } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const UA = "LabUCSM/1.0 (laboratorio academico)";

app.use(cors());
app.use(express.json());

const osmFetch = (url) =>
  fetch(url, { headers: { "User-Agent": UA } }).then((res) => res.json());

app.get("/api/geocode", async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Se requieren lat y lon" });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const data = await osmFetch(url);

    res.json({
      direccion: data.display_name,
      ciudad: data.address?.city || data.address?.town,
      pais: data.address?.country,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/ruta", async (req, res) => {
  const { oLat, oLon, dLat, dLon } = req.query;

  if (!oLat || !oLon || !dLat || !dLon) {
    return res
      .status(400)
      .json({ error: "Se requieren coordenadas de origen y destino" });
  }

  try {
    // 1. Llamada a OSRM (Siguiendo lon, lat como indica la práctica [cite: 73])
    const url = `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`;
    const data = await osmFetch(url);

    if (data.code !== "Ok") {
      return res.status(502).json({ error: data.code });
    }

    const ruta = data.routes[0];
    const resultado = {
      distancia_km: (ruta.distance / 1000).toFixed(2), // Conversión a km
      duracion_min: (ruta.duration / 60).toFixed(1), // Conversión a min
    };

    const sql = `
        INSERT INTO historial_consultas 
        (origen_lat, origen_lon, destino_lat, destino_lon, distancia_km, duracion_min)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [
      oLat,
      oLon,
      dLat,
      dLon,
      resultado.distancia_km,
      resultado.duracion_min,
    ];

    try {
      await query(sql, values);
    } catch (dbError) {
      console.error("Error guardando en historial:", dbError);
    }

    // 3. Respuesta final al cliente
    res.json(resultado);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(
    `Servidor de Tecnologías Emergentes corriendo en http://localhost:${PORT}`,
  );
});
