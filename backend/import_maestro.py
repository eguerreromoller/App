import csv
import os
import re
import uuid
import random
import unicodedata
from datetime import datetime, timezone
from pymongo import MongoClient

random.seed(7)

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
CSV_PATH = "/tmp/maestro.csv"

RUBRO_MAP = {
    "vulcanizacion, alineacion y balanceo": "neumaticos",
    "electricidad automotriz": "mecanica-general",
    "personalizacion automotriz": "personalizacion",
    "gruas": "gruas",
    "mecanica general": "mecanica-general",
    "desabolladura y pintura": "desabolladura-pintura",
    "frenos": "frenos",
}

IMG = {
    "neumaticos": "https://images.unsplash.com/photo-1645445522156-9ac06bc7a767?q=80&w=800",
    "mecanica-general": "https://images.pexels.com/photos/8985454/pexels-photo-8985454.jpeg?auto=compress&cs=tinysrgb&w=800",
    "personalizacion": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=800",
    "gruas": "https://images.unsplash.com/photo-1600661653561-629509216228?q=80&w=800",
    "desabolladura-pintura": "https://images.pexels.com/photos/30250199/pexels-photo-30250199.jpeg?auto=compress&cs=tinysrgb&w=800",
    "frenos": "https://images.pexels.com/photos/34277926/pexels-photo-34277926.jpeg?auto=compress&cs=tinysrgb&w=800",
}

SERVICES = {
    "neumaticos": ["Vulcanización", "Alineación", "Balanceo", "Venta de neumáticos"],
    "mecanica-general": ["Mecánica general", "Diagnóstico", "Sistema eléctrico"],
    "personalizacion": ["Personalización", "Accesorios", "Tuning"],
    "gruas": ["Servicio de grúa", "Asistencia en carretera"],
    "desabolladura-pintura": ["Desabolladura", "Pintura", "Pulido"],
    "frenos": ["Frenos", "Pastillas", "Discos"],
}

COMUNA_COORDS = {
    "Puente Alto": (-33.6116, -70.5758), "Maipú": (-33.5110, -70.7580),
    "La Florida": (-33.5220, -70.5980), "Macul": (-33.4900, -70.5990),
    "San Bernardo": (-33.5920, -70.6990), "Recoleta": (-33.4020, -70.6390),
    "Quilicura": (-33.3670, -70.7290), "Peñalolén": (-33.4880, -70.5460),
    "Las Condes": (-33.4088, -70.5697), "La Reina": (-33.4460, -70.5370),
    "Independencia": (-33.4160, -70.6640), "La Cisterna": (-33.5290, -70.6620),
    "Quinta Normal": (-33.4270, -70.6980), "Santiago Centro": (-33.4489, -70.6693),
    "Ñuñoa": (-33.4569, -70.5990), "Pudahuel": (-33.4420, -70.7620),
    "Colina": (-33.2020, -70.6740), "Providencia": (-33.4260, -70.6190),
    "Estación Central": (-33.4610, -70.6980), "Renca": (-33.4040, -70.7260),
    "Conchalí": (-33.3830, -70.6750), "San Miguel": (-33.4970, -70.6510),
    "Lo Prado": (-33.4440, -70.7260), "Cerrillos": (-33.4960, -70.7150),
    "Cerro Navia": (-33.4230, -70.7410), "Huechuraba": (-33.3690, -70.6390),
    "La Pintana": (-33.5830, -70.6340), "Lampa": (-33.2860, -70.8760),
    "El Bosque": (-33.5620, -70.6740), "Lo Barnechea": (-33.3510, -70.5180),
    "La Granja": (-33.5410, -70.6250), "Lo Espejo": (-33.5220, -70.6890),
    "Pirque": (-33.6400, -70.5490), "Pedro Aguirre Cerda": (-33.4870, -70.6720),
    "San Ramón": (-33.5370, -70.6420), "Vitacura": (-33.3900, -70.5580),
    "Santiago": (-33.4489, -70.6693), "San Joaquín": (-33.4903, -70.6274),
}
DEFAULT_COORD = (-33.4489, -70.6693)


def parse_phone(raw: str):
    if not raw:
        return ""
    if any(x in raw.lower() for x in ["no ", "s/n", "probable", "n/a"]):
        # 'Probable (celular)' etc -> not a real number
        if not re.search(r"\d", raw):
            return ""
    digits = re.sub(r"[^\d]", "", raw)
    if not digits:
        return ""
    if digits.startswith("56"):
        digits = digits[2:]
    if len(digits) == 9 and digits.startswith("9"):
        return "+56" + digits
    if len(digits) == 8:
        return "+562" + digits
    return "+56" + digits


def clean_website(raw: str):
    if not raw:
        return None
    r = raw.strip()
    if not r or any(x in r.lower() for x in ["no ", "n/a"]):
        return None
    if not r.startswith("http"):
        r = "https://" + r
    return r


def clean(raw: str):
    r = (raw or "").strip()
    if r.lower() in ("", "no", "n/a", "no observado", "no encontrado"):
        return ""
    return r


client = MongoClient(MONGO_URL)
db = client[DB_NAME]

inserted = skipped = unmapped = 0

with open(CSV_PATH, encoding="utf-8-sig") as fh:
    for row in csv.DictReader(fh):
        name = clean(row.get("Nombre"))
        comuna = clean(row.get("Comuna")) or "Santiago"
        if not name:
            continue
        rubro_raw = re.sub(r"\s+", " ", (row.get("Rubro") or "").strip().lower())
        rubro_raw = unicodedata.normalize("NFKD", rubro_raw).encode("ascii", "ignore").decode("ascii")
        category = RUBRO_MAP.get(rubro_raw)
        if not category:
            unmapped += 1
            continue

        if db.workshops.find_one({"name": name, "comuna": comuna}):
            skipped += 1
            continue

        address = clean(row.get("Dirección Completa")) or comuna
        try:
            rating = float((row.get("Puntuación Google") or "").replace(",", ".")) if clean(row.get("Puntuación Google")) else 4.5
        except ValueError:
            rating = 4.5
        try:
            reviews = int(re.sub(r"[^\d]", "", row.get("Número de Reseñas") or "")) if clean(row.get("Número de Reseñas")) else 0
        except ValueError:
            reviews = 0

        phone = parse_phone(clean(row.get("Teléfono")))
        whatsapp = parse_phone(clean(row.get("WhatsApp"))) or (phone if phone.startswith("+569") else None)
        website = clean_website(clean(row.get("Sitio Web")))
        social = clean(row.get("Instagram/Facebook"))
        if not website and social and "." in social:
            website = "https://" + social.lstrip("@").strip()

        tipo = clean(row.get("Tipo de Negocio"))
        fuertes = clean(row.get("Puntos Fuertes"))
        publico = clean(row.get("Público Objetivo"))
        parts = []
        if tipo:
            parts.append(tipo + ".")
        if fuertes:
            parts.append("Destaca por: " + fuertes + ".")
        if publico:
            parts.append("Ideal para: " + publico + ".")
        description = " ".join(parts) or "Prestador de servicios automotrices."

        clat, clng = COMUNA_COORDS.get(comuna, DEFAULT_COORD)
        lat = round(clat + random.uniform(-0.012, 0.012), 6)
        lng = round(clng + random.uniform(-0.012, 0.012), 6)

        doc = {
            "id": str(uuid.uuid4()),
            "name": name,
            "category": category,
            "categories": [category],
            "description": description,
            "address": address,
            "comuna": comuna,
            "region": "Región Metropolitana",
            "phone": phone,
            "whatsapp": whatsapp,
            "email": None,
            "website": website,
            "lat": lat,
            "lng": lng,
            "image_url": IMG[category],
            "services": SERVICES[category],
            "hours": {"Lunes-Viernes": "09:00 - 18:30", "Sábado": "09:00 - 14:00"},
            "rating": rating,
            "review_count": reviews,
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        db.workshops.insert_one(doc)
        inserted += 1

print(f"Inserted: {inserted}, Skipped (dupes): {skipped}, Unmapped rubro: {unmapped}")
print("Total workshops:", db.workshops.count_documents({}))
