import csv
import os
import re
import uuid
import random
import unicodedata
from datetime import datetime, timezone
from pymongo import MongoClient

random.seed(42)

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

FILES = {
    "/tmp/leads/penalolen.csv": ("Peñalolén", (-33.4880, -70.5460)),
    "/tmp/leads/laflorida.csv": ("La Florida", (-33.5220, -70.5980)),
    "/tmp/leads/sanbernardo.csv": ("San Bernardo", (-33.5920, -70.6990)),
    "/tmp/leads/puentealto.csv": ("Puente Alto", (-33.6116, -70.5758)),
}

CARWASH_IMAGES = [
    "https://images.unsplash.com/photo-1605618313023-d3b76fd39e3f?q=80&w=800",
    "https://images.unsplash.com/photo-1552930294-6b595f4c2e6a?q=80&w=800",
    "https://images.pexels.com/photos/6873127/pexels-photo-6873127.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=800",
]


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z]", "", s.lower())


def find(row_norm: dict, *cands):
    for c in cands:
        for k, v in row_norm.items():
            if c in k:
                return v
    return ""


def parse_phone(raw: str):
    if not raw:
        return ""
    r = raw.strip()
    if any(x in r.lower() for x in ["no confirm", "no encontr", "no tiene", "n/a"]):
        return ""
    digits = re.sub(r"[^\d]", "", r)
    if not digits:
        return ""
    # Chilean: strip leading 56 if present
    if digits.startswith("56"):
        digits = digits[2:]
    if len(digits) == 9 and digits.startswith("9"):
        return "+56" + digits
    if len(digits) == 8:  # landline without area code -> assume Santiago 2
        return "+562" + digits
    return "+56" + digits


def clean_website(raw: str):
    if not raw:
        return None
    r = raw.strip()
    if any(x in r.lower() for x in ["no tiene", "no encontr", "no confirm", "n/a", "no visible"]):
        return None
    if not r.startswith("http"):
        r = "https://" + r
    return r


def clean_val(raw: str):
    if not raw:
        return ""
    r = raw.strip()
    if r.lower() in ("no confirmado", "no encontrado", "no tiene", "n/a"):
        return ""
    return r


client = MongoClient(MONGO_URL)
db = client[DB_NAME]

inserted = 0
skipped = 0

for path, (comuna, (clat, clng)) in FILES.items():
    with open(path, encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            row_norm = {norm(k): (v or "").strip() for k, v in row.items() if k}
            name = find(row_norm, "nombre")
            if not name:
                continue
            # skip duplicates (same name + comuna)
            if db.workshops.find_one({"name": name, "comuna": comuna}):
                skipped += 1
                continue

            address = find(row_norm, "direccion", "direccioncompleta") or comuna
            rating_raw = find(row_norm, "puntuacion", "puntuaciongoogle")
            try:
                rating = float(rating_raw.replace(",", ".")) if rating_raw else 4.5
            except ValueError:
                rating = 4.5
            reviews_raw = find(row_norm, "resenas", "numeroderesenas")
            try:
                reviews = int(re.sub(r"[^\d]", "", reviews_raw)) if reviews_raw else 0
            except ValueError:
                reviews = 0

            phone = parse_phone(find(row_norm, "telefono"))
            wa_raw = find(row_norm, "whatsapp")
            whatsapp = parse_phone(wa_raw) or (phone if phone.startswith("+569") else None)
            website = clean_website(find(row_norm, "sitioweb"))
            social = clean_val(find(row_norm, "instagramfacebook", "instagram"))
            tipo = clean_val(find(row_norm, "tipodenegocio"))
            fuertes = clean_val(find(row_norm, "puntosfuertes"))
            publico = clean_val(find(row_norm, "publicoobjetivo"))

            desc_parts = []
            if tipo:
                desc_parts.append(tipo + ".")
            if fuertes:
                desc_parts.append("Destaca por: " + fuertes + ".")
            if publico:
                desc_parts.append("Ideal para: " + publico + ".")
            description = " ".join(desc_parts) or "Servicio de lavado de vehículos (carwash)."

            services = ["Lavado de vehículos", "Lavado exterior", "Lavado interior"]

            lat = round(clat + random.uniform(-0.012, 0.012), 6)
            lng = round(clng + random.uniform(-0.012, 0.012), 6)

            doc = {
                "id": str(uuid.uuid4()),
                "name": name,
                "category": "lavado",
                "description": description,
                "address": address,
                "comuna": comuna,
                "region": "Región Metropolitana",
                "phone": phone,
                "whatsapp": whatsapp,
                "email": None,
                "website": website or (f"https://{social}" if social and "." in social else None),
                "lat": lat,
                "lng": lng,
                "image_url": random.choice(CARWASH_IMAGES),
                "services": services,
                "hours": {"Lunes-Sábado": "09:00 - 19:00", "Domingo": "10:00 - 14:00"},
                "rating": rating,
                "review_count": reviews,
                "is_featured": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            db.workshops.insert_one(doc)
            inserted += 1

print(f"Inserted: {inserted}, Skipped (dupes): {skipped}")
print("Total lavado workshops:", db.workshops.count_documents({"category": "lavado"}))
print("Total workshops:", db.workshops.count_documents({}))
