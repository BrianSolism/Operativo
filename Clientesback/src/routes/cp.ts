import { Router } from 'express';

const router = Router();

router.get('/:cp', async (req, res) => {
  const { cp } = req.params;
  if (!/^\d{5}$/.test(cp)) {
    return res.status(400).json({ error: 'CP inválido' });
  }

  // Intento 1: SEPOMEX (colonias + municipio + estado) — timeout 3s
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const sepRes = await fetch(`https://api-sepomex.hckdrk.mx/query/info_cp/${cp}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (sepRes.ok) {
      const data: any = await sepRes.json();
      if (!data.error && data.response?.length) {
        const colonias: string[] = [...new Set<string>(
          data.response.map((r: any) => r.d_asenta).filter(Boolean)
        )];
        const first = data.response[0];
        return res.json({ colonias, ciudad: first.d_mnpio ?? '', estado: first.d_estado ?? '' });
      }
    }
  } catch { /* sigue al fallback */ }

  // Intento 2: Nominatim (sin lista de colonias)
  try {
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${cp}&country=MX&format=json&addressdetails=1&limit=1`,
      { headers: { 'User-Agent': 'AlgebasaApp/1.0' } }
    );
    if (!nomRes.ok) return res.status(404).json({ error: 'C.P. no encontrado' });
    const data = await nomRes.json() as any[];
    if (!data.length) return res.status(404).json({ error: 'C.P. no encontrado' });
    const addr = data[0].address;
    const ciudad = addr.city_district ?? addr.borough ?? addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '';
    return res.json({ colonias: [], ciudad, estado: addr.state ?? '' });
  } catch {
    return res.status(500).json({ error: 'Error consultando C.P.' });
  }
});

export default router;
