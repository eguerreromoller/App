from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Annotated
import uuid
import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ----- Auth config -----
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
TOKEN_MINUTES = int(os.getenv('ACCESS_TOKEN_MINUTES', '1440'))
ADMIN_EMAIL = os.environ['ADMIN_EMAIL'].strip().lower()
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY', '')

app = FastAPI(title="Vitrina Automotriz API")
api_router = APIRouter(prefix="/api")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    if not password or len(password.encode("utf-8")) > 72:
        raise ValueError("Password must be 1-72 UTF-8 bytes")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


DUMMY_HASH = hash_password("dummy-password-used-only-for-timing")


def create_access_token(email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "role": "admin",
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def authenticate(email: str, password: str):
    email = email.strip().lower()
    admin = await db.admins.find_one({"email": email})
    if not admin:
        verify_password(password, DUMMY_HASH)
        return None
    return admin if verify_password(password, admin["password_hash"]) else None


async def get_current_admin(token: str = Depends(oauth2_scheme)):
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autorizado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if not email or payload.get("role") != "admin":
            raise credentials_error
    except InvalidTokenError:
        raise credentials_error
    admin = await db.admins.find_one({"email": email}, {"_id": 1, "email": 1, "role": 1})
    if not admin or admin.get("role") != "admin":
        raise credentials_error
    return admin


AdminDep = Annotated[dict, Depends(get_current_admin)]


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


# ----- Models -----
class Workshop(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    categories: List[str] = []
    description: str
    address: str
    comuna: str
    region: str = "Región Metropolitana"
    phone: str
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    image_url: str
    services: List[str] = []
    hours: Dict[str, str] = {}
    rating: float = 4.5
    review_count: int = 0
    is_featured: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class WorkshopCreate(BaseModel):
    name: str
    category: str
    categories: List[str] = []
    description: str
    address: str
    comuna: str
    region: str = "Región Metropolitana"
    phone: str
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    image_url: str
    services: List[str] = []
    hours: Dict[str, str] = {}
    rating: float = 4.5
    review_count: int = 0
    is_featured: bool = False


class Category(BaseModel):
    key: str
    name: str
    icon: str
    image_url: str
    description: str


CATEGORIES: List[Dict] = [
    {"key": "mecanica-general", "name": "Mecánica General", "icon": "wrench",
     "image_url": "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?q=80&w=800",
     "description": "Mantenimiento y reparación de motores, transmisiones y más."},
    {"key": "desabolladura-pintura", "name": "Desabolladura y Pintura", "icon": "paint-bucket",
     "image_url": "https://images.pexels.com/photos/30250199/pexels-photo-30250199.jpeg?auto=compress&cs=tinysrgb&w=800",
     "description": "Restauración estética, eliminación de abolladuras y pintura."},
    {"key": "gruas", "name": "Servicio de Grúas", "icon": "truck",
     "image_url": "https://images.unsplash.com/photo-1600661653561-629509216228?q=80&w=800",
     "description": "Asistencia rápida en caso de averías o accidentes."},
    {"key": "neumaticos", "name": "Neumáticos y Alineación", "icon": "circle-dot",
     "image_url": "https://images.unsplash.com/photo-1645445522156-9ac06bc7a767?q=80&w=800",
     "description": "Alineación, balanceo y venta de neumáticos."},
    {"key": "lubricacion", "name": "Lubricación", "icon": "droplet",
     "image_url": "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=800",
     "description": "Cambios de aceite y lubricación completa."},
    {"key": "frenos", "name": "Frenos", "icon": "octagon",
     "image_url": "https://images.pexels.com/photos/34277926/pexels-photo-34277926.jpeg?auto=compress&cs=tinysrgb&w=800",
     "description": "Inspección y mantenimiento del sistema de frenado."},
    {"key": "lavado", "name": "Lavado de Vehículos", "icon": "sparkles",
     "image_url": "https://images.unsplash.com/photo-1605618313023-d3b76fd39e3f?q=80&w=800",
     "description": "Lavado exterior e interior detallado."},
    {"key": "personalizacion", "name": "Personalización", "icon": "sparkle",
     "image_url": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=800",
     "description": "Modificaciones estéticas y funcionales para tu vehículo."},
    {"key": "distribuidores", "name": "Distribuidores", "icon": "store",
     "image_url": "https://images.pexels.com/photos/12579236/pexels-photo-12579236.jpeg?auto=compress&cs=tinysrgb&w=800",
     "description": "Proveedores de repuestos y accesorios."},
]


SEED_WORKSHOPS: List[Dict] = [
    {
        "name": "Taller Mecánica Andes",
        "category": "mecanica-general",
        "description": "Taller integral con más de 20 años de experiencia en mecánica general, diagnóstico computarizado y reparación de motores. Atendemos todas las marcas.",
        "address": "Av. Vicuña Mackenna 3450",
        "comuna": "San Joaquín",
        "phone": "+56223456789",
        "whatsapp": "+56932196215",
        "email": "contacto@mecanicaandes.cl",
        "website": "https://vitrinaautomotriz.cl/",
        "lat": -33.4903, "lng": -70.6274,
        "image_url": "https://images.pexels.com/photos/8985454/pexels-photo-8985454.jpeg?auto=compress&cs=tinysrgb&w=800",
        "services": ["Diagnóstico computarizado", "Cambio de correa", "Reparación de motor", "Sistema eléctrico"],
        "hours": {"Lunes-Viernes": "08:30 - 19:00", "Sábado": "09:00 - 14:00", "Domingo": "Cerrado"},
        "rating": 4.8, "review_count": 142, "is_featured": True,
    },
    {
        "name": "Pintura Automotriz Providencia",
        "category": "desabolladura-pintura",
        "description": "Especialistas en desabolladura sin daño y pintura horneada de alta calidad. Trabajamos con las mejores marcas de pintura del mercado.",
        "address": "Av. Providencia 1250",
        "comuna": "Providencia",
        "phone": "+56226543210",
        "whatsapp": "+56911223344",
        "email": "info@pinturaprovidencia.cl",
        "lat": -33.4260, "lng": -70.6135,
        "image_url": "https://images.pexels.com/photos/30250199/pexels-photo-30250199.jpeg?auto=compress&cs=tinysrgb&w=800",
        "services": ["Pintura horneada", "Desabolladura sin daño", "Pulido y encerado", "Restauración estética"],
        "hours": {"Lunes-Viernes": "09:00 - 18:30", "Sábado": "09:00 - 13:00", "Domingo": "Cerrado"},
        "rating": 4.7, "review_count": 89, "is_featured": True,
    },
    {
        "name": "Grúas Rápidas Santiago 24/7",
        "category": "gruas",
        "description": "Servicio de grúas y asistencia en carretera las 24 horas del día. Cobertura en todo Santiago y regiones cercanas.",
        "address": "Camino a Melipilla 4520",
        "comuna": "Maipú",
        "phone": "+56227890123",
        "whatsapp": "+56988776655",
        "lat": -33.5111, "lng": -70.7500,
        "image_url": "https://images.unsplash.com/photo-1600661653561-629509216228?q=80&w=800",
        "services": ["Grúa plataforma", "Asistencia mecánica", "Cambio de neumático", "Carga de batería"],
        "hours": {"Lunes-Domingo": "24 horas"},
        "rating": 4.6, "review_count": 210, "is_featured": True,
    },
    {
        "name": "Neumáticos ExpressCar",
        "category": "neumaticos",
        "description": "Venta e instalación de neumáticos de las principales marcas. Alineación y balanceo computarizado en 30 minutos.",
        "address": "Av. Américo Vespucio 1501",
        "comuna": "Ñuñoa",
        "phone": "+56222345678",
        "whatsapp": "+56955443322",
        "website": "https://vitrinaautomotriz.cl/",
        "lat": -33.4569, "lng": -70.5877,
        "image_url": "https://images.unsplash.com/photo-1645445522156-9ac06bc7a767?q=80&w=800",
        "services": ["Alineación 3D", "Balanceo computarizado", "Rotación de neumáticos", "Venta de llantas"],
        "hours": {"Lunes-Viernes": "08:00 - 20:00", "Sábado": "09:00 - 15:00"},
        "rating": 4.5, "review_count": 156, "is_featured": False,
    },
    {
        "name": "Lubricentro El Bosque",
        "category": "lubricacion",
        "description": "Cambio de aceite y filtros en menos de 20 minutos. Trabajamos con aceites sintéticos y semisintéticos.",
        "address": "Av. Gran Avenida 8901",
        "comuna": "El Bosque",
        "phone": "+56225678901",
        "whatsapp": "+56977889900",
        "lat": -33.5674, "lng": -70.6740,
        "image_url": "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=800",
        "services": ["Cambio de aceite", "Cambio de filtros", "Revisión de niveles", "Lubricación de suspensión"],
        "hours": {"Lunes-Viernes": "08:30 - 19:30", "Sábado": "09:00 - 14:00"},
        "rating": 4.4, "review_count": 78, "is_featured": False,
    },
    {
        "name": "Frenos Seguros Las Condes",
        "category": "frenos",
        "description": "Especialistas en sistemas de frenado. Cambio de pastillas, discos, tambores y revisión completa del sistema hidráulico.",
        "address": "Av. Apoquindo 4501",
        "comuna": "Las Condes",
        "phone": "+56221112233",
        "whatsapp": "+56966554433",
        "email": "servicio@frenosseguros.cl",
        "lat": -33.4088, "lng": -70.5697,
        "image_url": "https://images.pexels.com/photos/34277926/pexels-photo-34277926.jpeg?auto=compress&cs=tinysrgb&w=800",
        "services": ["Cambio de pastillas", "Rectificado de discos", "Sistema hidráulico", "Frenos ABS"],
        "hours": {"Lunes-Viernes": "09:00 - 19:00", "Sábado": "10:00 - 14:00"},
        "rating": 4.9, "review_count": 201, "is_featured": True,
    },
    {
        "name": "AutoSpa Premium Wash",
        "category": "lavado",
        "description": "Lavado detallado exterior e interior, hidrolavado, encerado premium y limpieza de tapiz. Café gratis para clientes.",
        "address": "Av. Kennedy 5601",
        "comuna": "Las Condes",
        "phone": "+56224445566",
        "whatsapp": "+56944556677",
        "lat": -33.4090, "lng": -70.5510,
        "image_url": "https://images.unsplash.com/photo-1605618313023-d3b76fd39e3f?q=80&w=800",
        "services": ["Lavado exterior", "Limpieza de tapiz", "Encerado premium", "Detailing completo"],
        "hours": {"Lunes-Domingo": "09:00 - 20:00"},
        "rating": 4.6, "review_count": 95, "is_featured": False,
    },
    {
        "name": "Tuning Custom Garage",
        "category": "personalizacion",
        "description": "Personaliza tu auto con nosotros: llantas, escapes deportivos, suspensiones, vinilos y programación de ECU.",
        "address": "Av. Departamental 1245",
        "comuna": "La Florida",
        "phone": "+56228889900",
        "whatsapp": "+56922334455",
        "website": "https://vitrinaautomotriz.cl/",
        "lat": -33.5220, "lng": -70.5980,
        "image_url": "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=800",
        "services": ["Escape deportivo", "Vinilos", "Suspensión regulable", "Programación ECU"],
        "hours": {"Martes-Sábado": "10:00 - 19:00", "Domingo-Lunes": "Cerrado"},
        "rating": 4.7, "review_count": 64, "is_featured": True,
    },
    {
        "name": "Repuestos Motores Chile",
        "category": "distribuidores",
        "description": "Distribuidor oficial de repuestos originales y alternativos para todas las marcas. Envíos a todo Chile.",
        "address": "Av. 10 de Julio 856",
        "comuna": "Santiago",
        "phone": "+56223334455",
        "whatsapp": "+56911998877",
        "email": "ventas@repuestosmotores.cl",
        "website": "https://vitrinaautomotriz.cl/",
        "lat": -33.4515, "lng": -70.6389,
        "image_url": "https://images.pexels.com/photos/12579236/pexels-photo-12579236.jpeg?auto=compress&cs=tinysrgb&w=800",
        "services": ["Repuestos originales", "Repuestos alternativos", "Envíos a regiones", "Asesoría técnica"],
        "hours": {"Lunes-Viernes": "09:00 - 19:00", "Sábado": "09:30 - 14:00"},
        "rating": 4.5, "review_count": 312, "is_featured": False,
    },
    {
        "name": "Taller Diesel Puente Alto",
        "category": "mecanica-general",
        "description": "Especialistas en vehículos diésel. Reparación de bombas, inyectores y sistemas common-rail.",
        "address": "Av. Concha y Toro 3510",
        "comuna": "Puente Alto",
        "phone": "+56227777888",
        "whatsapp": "+56933221100",
        "lat": -33.6100, "lng": -70.5750,
        "image_url": "https://images.pexels.com/photos/8985454/pexels-photo-8985454.jpeg?auto=compress&cs=tinysrgb&w=800",
        "services": ["Reparación diésel", "Inyectores", "Bombas de inyección", "Common-rail"],
        "hours": {"Lunes-Viernes": "08:00 - 18:30", "Sábado": "08:30 - 13:30"},
        "rating": 4.6, "review_count": 88, "is_featured": False,
    },
    {
        "name": "Pintura Express Recoleta",
        "category": "desabolladura-pintura",
        "description": "Trabajos rápidos de pintura parcial y completa. Presupuesto sin compromiso.",
        "address": "Av. Recoleta 2210",
        "comuna": "Recoleta",
        "phone": "+56224443355",
        "whatsapp": "+56988112233",
        "lat": -33.4020, "lng": -70.6390,
        "image_url": "https://images.pexels.com/photos/30250199/pexels-photo-30250199.jpeg?auto=compress&cs=tinysrgb&w=800",
        "services": ["Pintura parcial", "Pulido", "Retoque de rayones", "Pintura completa"],
        "hours": {"Lunes-Viernes": "09:00 - 18:00", "Sábado": "09:00 - 13:00"},
        "rating": 4.3, "review_count": 54, "is_featured": False,
    },
    {
        "name": "Electromecánica Vitacura",
        "category": "mecanica-general",
        "description": "Especialistas en sistema eléctrico automotriz, alternadores, partidas y computadoras de vehículos.",
        "address": "Av. Vitacura 6120",
        "comuna": "Vitacura",
        "phone": "+56222229988",
        "whatsapp": "+56999887766",
        "email": "servicio@electromecanicavitacura.cl",
        "lat": -33.3900, "lng": -70.5580,
        "image_url": "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?q=80&w=800",
        "services": ["Sistema eléctrico", "Alternadores", "Motor de partida", "Computadoras"],
        "hours": {"Lunes-Viernes": "08:30 - 19:00", "Sábado": "09:00 - 14:00"},
        "rating": 4.8, "review_count": 176, "is_featured": True,
    },
]


# ----- Startup: seed data -----
@app.on_event("startup")
async def seed_data():
    count = await db.workshops.count_documents({})
    if count == 0:
        docs = []
        for w in SEED_WORKSHOPS:
            ws = Workshop(**w).dict()
            docs.append(ws)
        if docs:
            await db.workshops.insert_many(docs)
        logging.info(f"Seeded {len(docs)} workshops")

    # Migration: ensure every workshop has a `categories` array (rubros).
    await db.workshops.update_many(
        {"categories": {"$exists": False}},
        [{"$set": {"categories": ["$category"]}}],
    )
    await db.workshops.update_many(
        {"categories": {"$size": 0}},
        [{"$set": {"categories": ["$category"]}}],
    )

    # Idempotent admin seed
    await db.admins.create_index("email", unique=True, name="admin_email_unique")
    existing = await db.admins.find_one({"email": ADMIN_EMAIL}, {"_id": 1})
    if existing is None:
        await db.admins.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
        })
        logging.info("Seeded admin account")


# ----- Endpoints -----
@api_router.get("/")
async def root():
    return {"message": "Vitrina Automotriz API"}


@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    return [Category(**c) for c in CATEGORIES]


@api_router.get("/categories/counts")
async def get_category_counts():
    counts: Dict[str, int] = {}
    for c in CATEGORIES:
        key = c["key"]
        counts[key] = await db.workshops.count_documents(
            {"$or": [{"category": key}, {"categories": key}]}
        )
    return counts


@api_router.get("/comunas", response_model=List[str])
async def get_comunas():
    comunas = await db.workshops.distinct("comuna")
    return sorted(comunas)


@api_router.get("/workshops/featured", response_model=List[Workshop])
async def get_featured():
    cursor = db.workshops.find({"is_featured": True}, {"_id": 0}).limit(10)
    items = await cursor.to_list(length=10)
    return [Workshop(**i) for i in items]


@api_router.get("/workshops", response_model=List[Workshop])
async def list_workshops(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    comuna: Optional[str] = Query(None),
    limit: int = Query(1000, le=5000),
):
    and_conditions: List[Dict] = []
    if category:
        and_conditions.append({"$or": [{"category": category}, {"categories": category}]})
    if comuna:
        and_conditions.append({"comuna": comuna})
    if search:
        and_conditions.append({"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"services": {"$regex": search, "$options": "i"}},
            {"comuna": {"$regex": search, "$options": "i"}},
        ]})
    q: Dict = {"$and": and_conditions} if and_conditions else {}
    cursor = db.workshops.find(q, {"_id": 0}).limit(limit)
    items = await cursor.to_list(length=limit)
    return [Workshop(**i) for i in items]


@api_router.get("/workshops/{workshop_id}", response_model=Workshop)
async def get_workshop(workshop_id: str):
    item = await db.workshops.find_one({"id": workshop_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Workshop not found")
    return Workshop(**item)


# ----- Auth -----
@api_router.post("/auth/login", response_model=TokenOut)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    admin = await authenticate(form.username, form.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenOut(access_token=create_access_token(admin["email"]), email=admin["email"])


@api_router.get("/auth/me")
async def me(admin: AdminDep):
    return {"email": admin["email"], "role": admin["role"]}


# ----- Admin workshop CRUD (protected) -----
def _normalize_categories(data: Dict) -> Dict:
    cats = [c for c in (data.get("categories") or []) if c]
    if not cats and data.get("category"):
        cats = [data["category"]]
    # dedupe preserving order
    seen = set()
    cats = [c for c in cats if not (c in seen or seen.add(c))]
    data["categories"] = cats
    if cats:
        data["category"] = cats[0]
    return data


@api_router.post("/workshops", response_model=Workshop)
async def create_workshop(payload: WorkshopCreate, admin: AdminDep):
    ws = Workshop(**_normalize_categories(payload.dict()))
    await db.workshops.insert_one(ws.dict())
    return ws


@api_router.put("/workshops/{workshop_id}", response_model=Workshop)
async def update_workshop(workshop_id: str, payload: WorkshopCreate, admin: AdminDep):
    existing = await db.workshops.find_one({"id": workshop_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Workshop not found")
    updates = _normalize_categories(payload.dict())
    await db.workshops.update_one({"id": workshop_id}, {"$set": updates})
    merged = await db.workshops.find_one({"id": workshop_id}, {"_id": 0})
    return Workshop(**merged)


@api_router.delete("/workshops/{workshop_id}")
async def delete_workshop(workshop_id: str, admin: AdminDep):
    result = await db.workshops.delete_one({"id": workshop_id})
    if result.deleted_count != 1:
        raise HTTPException(status_code=404, detail="Workshop not found")
    return {"deleted": True, "id": workshop_id}


# ----- Turbo AI Assistant -----
class ChatIn(BaseModel):
    session_id: str
    message: str


class ChatOut(BaseModel):
    reply: str
    recommendations: List[Workshop] = []


def _cat_name(key: str) -> str:
    for c in CATEGORIES:
        if c["key"] == key:
            return c["name"]
    return key


async def _build_catalog() -> str:
    cursor = db.workshops.find({}, {"_id": 0})
    items = await cursor.to_list(length=500)
    lines = []
    for w in items:
        servicios = ", ".join(w.get("services", []))
        cats = w.get("categories") or [w.get("category", "")]
        rubros = ", ".join(_cat_name(c) for c in cats if c)
        lines.append(
            f"- ID: {w['id']} | Nombre: {w['name']} | Rubros: {rubros} "
            f"| Comuna: {w.get('comuna','')} | Servicios: {servicios}"
        )
    return "\n".join(lines)


@api_router.post("/chat", response_model=ChatOut)
async def chat(payload: ChatIn):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="Asistente no disponible")

    from emergentintegrations.llm.chat import LlmChat, UserMessage

    catalog = await _build_catalog()

    # Prior conversation for this session
    history = await db.chat_messages.find(
        {"session_id": payload.session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(length=50)

    transcript = ""
    for m in history:
        who = "Cliente" if m["role"] == "user" else "Turbo"
        transcript += f"{who}: {m['content']}\n"

    system_message = (
        "Eres 'Turbo', el asistente virtual de Vitrina Automotriz, un directorio de talleres "
        "automotrices en Chile. Hablas SIEMPRE en español chileno, de forma cordial, breve y "
        "cercana. Tu objetivo es entender qué servicio necesita el cliente para su vehículo y en "
        "qué comuna se encuentra, y luego recomendarle el o los talleres más adecuados EXCLUSIVAMENTE "
        "de la siguiente lista. NUNCA inventes talleres, teléfonos ni datos que no estén en la lista.\n\n"
        "Reglas:\n"
        "1. Si aún no sabes el servicio o la comuna, haz UNA pregunta corta para averiguarlo. No pidas todo de golpe.\n"
        "2. Cuando tengas suficiente información, recomienda 1 a 3 talleres de la lista, mencionando su nombre y comuna, y explica brevemente por qué encajan.\n"
        "3. Si no hay un taller en la comuna exacta, ofrece el más cercano o relevante de la lista y acláralo.\n"
        "4. Sé conciso (máximo 4 frases antes de recomendar).\n"
        "5. Al final de tu mensaje, SIEMPRE agrega en una línea aparte el marcador con los IDs de los talleres que recomiendas en este turno, así: <<RECS:id1,id2>>. Si en este turno no recomiendas ninguno todavía, escribe <<RECS:>>. Este marcador es obligatorio y no debes explicarlo al cliente.\n\n"
        f"LISTA DE TALLERES DISPONIBLES:\n{catalog}"
    )

    user_text = payload.message
    if transcript:
        user_text = (
            f"Conversación hasta ahora:\n{transcript}\n"
            f"Nuevo mensaje del cliente: {payload.message}"
        )

    chat_client = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=payload.session_id,
        system_message=system_message,
    ).with_model("openai", "gpt-5.4")

    try:
        raw = await chat_client.send_message(UserMessage(text=user_text))
    except Exception as e:
        logging.exception("Turbo chat error")
        raise HTTPException(status_code=502, detail="No se pudo generar respuesta")

    reply_text = raw if isinstance(raw, str) else str(raw)

    # Parse recommendation marker
    rec_ids: List[str] = []
    import re
    m = re.search(r"<<RECS:([^>]*)>>", reply_text)
    if m:
        ids_part = m.group(1).strip()
        if ids_part:
            rec_ids = [x.strip() for x in ids_part.split(",") if x.strip()]
        reply_text = re.sub(r"<<RECS:[^>]*>>", "", reply_text).strip()

    recs: List[Workshop] = []
    if rec_ids:
        found = await db.workshops.find(
            {"id": {"$in": rec_ids}}, {"_id": 0}
        ).to_list(length=10)
        by_id = {w["id"]: w for w in found}
        for rid in rec_ids:
            if rid in by_id:
                recs.append(Workshop(**by_id[rid]))

    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_many([
        {"session_id": payload.session_id, "role": "user", "content": payload.message, "created_at": now},
        {"session_id": payload.session_id, "role": "assistant", "content": reply_text, "created_at": now},
    ])

    return ChatOut(reply=reply_text, recommendations=recs)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
