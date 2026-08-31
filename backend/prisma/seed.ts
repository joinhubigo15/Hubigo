/**
 * Permanent taxonomy seed — categories, cities, localities, amenities.
 *
 * Unlike seed-mock-businesses.ts, this is NOT meant to be torn down later: it's real reference
 * data the platform needs regardless of which businesses eventually get imported. Safe to
 * re-run (upserts by slug).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories: {
  name: string;
  slug: string;
  icon: string;
  subcategories?: { name: string; slug: string }[];
}[] = [
  {
    name: "Hospitals & Nursing Homes",
    slug: "hospitals",
    icon: "🏥",
    subcategories: [
      { name: "Multi-Speciality Hospital", slug: "multispecialty-hospital" },
      { name: "Super Specialty Hospital", slug: "super-specialty-hospital" },
      { name: "Private Hospital", slug: "private-hospital" },
      { name: "Maternity & Children Hospital", slug: "maternity-hospital" },
      { name: "Government & Public Hospital", slug: "government-hospital" },
      { name: "Cancer Hospital", slug: "cancer-hospital" },
      { name: "Cardiology Hospital", slug: "cardiology-hospital" },
      { name: "Orthopedic Hospital", slug: "orthopedic-hospital" },
    ],
  },
  {
    name: "Diagnostic Labs & Pathology",
    slug: "diagnostic-labs",
    icon: "🔬",
    subcategories: [
      { name: "Pathology Laboratory", slug: "pathology-lab" },
      { name: "Blood Testing Center", slug: "blood-test-center" },
      { name: "MRI & CT Scan Center", slug: "mri-ct-scan" },
      { name: "Radiology & X-Ray Center", slug: "radiology-xray" },
      { name: "Ultrasound & Sonography Center", slug: "ultrasound-center" },
      { name: "Full Body Health Checkup Center", slug: "health-checkup-center" },
    ],
  },
  {
    name: "Doctors & Specialist Clinics",
    slug: "doctors-clinics",
    icon: "🩺",
    subcategories: [
      { name: "General Physician", slug: "general-physician" },
      { name: "Pediatrician (Child Specialist)", slug: "pediatrician" },
      { name: "Dermatologist (Skin Specialist)", slug: "dermatologist" },
      { name: "Gynecologist & Obstetrician", slug: "gynecologist" },
      { name: "Ophthalmologist (Eye Specialist)", slug: "ophthalmologist" },
      { name: "ENT Specialist", slug: "ent-specialist" },
      { name: "Cardiologist (Heart Specialist)", slug: "cardiologist" },
      { name: "Neurologist", slug: "neurologist" },
      { name: "Orthopedic Doctor", slug: "orthopedic-doctor" },
    ],
  },
  {
    name: "Pharmacies & Chemists",
    slug: "pharmacies",
    icon: "💊",
    subcategories: [
      { name: "24/7 Pharmacy", slug: "24-7-pharmacy" },
      { name: "Retail Pharmacy & Drug Store", slug: "retail-pharmacy" },
      { name: "Hospital Pharmacy", slug: "hospital-pharmacy" },
      { name: "Ayurvedic & Homeopathic Pharmacy", slug: "ayurvedic-pharmacy" },
    ],
  },
  {
    name: "Dental Care & Dentists",
    slug: "dentists",
    icon: "🦷",
    subcategories: [
      { name: "Dental Clinic", slug: "dental-clinic" },
      { name: "Orthodontist", slug: "orthodontist" },
      { name: "Root Canal Specialist", slug: "root-canal-specialist" },
      { name: "Cosmetic Dentist", slug: "cosmetic-dentist" },
    ],
  },
  {
    name: "Eye Care & Optometrists",
    slug: "eye-care",
    icon: "👁️",
    subcategories: [
      { name: "Eye Hospital", slug: "eye-hospital" },
      { name: "Eye Clinic", slug: "eye-clinic" },
      { name: "Optometrist & Optician", slug: "optometrist" },
    ],
  },
  {
    name: "Physiotherapy & Rehabilitation",
    slug: "physiotherapy",
    icon: "🏃",
    subcategories: [
      { name: "Physiotherapy Clinic", slug: "physiotherapy-clinic" },
      { name: "Sports Rehabilitation Center", slug: "sports-rehab" },
      { name: "Spine & Joint Pain Clinic", slug: "spine-joint-clinic" },
    ],
  },
  {
    name: "Veterinary & Animal Care",
    slug: "veterinary",
    icon: "🐾",
    subcategories: [
      { name: "Veterinary Hospital", slug: "veterinary-hospital" },
      { name: "Pet Clinic", slug: "pet-clinic" },
    ],
  },
  {
    name: "Medical Supplies & Equipment",
    slug: "medical-equipment",
    icon: "🚑",
    subcategories: [
      { name: "Surgical Equipment Supplier", slug: "surgical-equipment" },
      { name: "Oxygen Cylinder & ICU Equipment", slug: "icu-equipment" },
      { name: "Orthopedic Equipment Supplier", slug: "orthopedic-equipment" },
    ],
  },
];

const cities: {
  name: string;
  slug: string;
  state: string;
  lat: number;
  lng: number;
  localities: { name: string; slug: string; pincode: string; lat: number; lng: number }[];
}[] = [
  {
    name: "Bangalore",
    slug: "bangalore",
    state: "Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    localities: [
      { name: "Koramangala", slug: "koramangala", pincode: "560034", lat: 12.9352, lng: 77.6146 },
      { name: "Indiranagar", slug: "indiranagar", pincode: "560038", lat: 12.9784, lng: 77.6408 },
      { name: "HSR Layout", slug: "hsr-layout", pincode: "560102", lat: 12.9121, lng: 77.6446 },
      { name: "Whitefield", slug: "whitefield", pincode: "560066", lat: 12.9698, lng: 77.7500 },
    ],
  },
  {
    name: "Mumbai",
    slug: "mumbai",
    state: "Maharashtra",
    lat: 19.076,
    lng: 72.8777,
    localities: [
      { name: "Andheri", slug: "andheri", pincode: "400053", lat: 19.1136, lng: 72.8697 },
      { name: "Bandra", slug: "bandra", pincode: "400050", lat: 19.0596, lng: 72.8295 },
      { name: "Powai", slug: "powai", pincode: "400076", lat: 19.1176, lng: 72.9060 },
    ],
  },
  {
    name: "Delhi",
    slug: "delhi",
    state: "Delhi",
    lat: 28.7041,
    lng: 77.1025,
    localities: [
      { name: "Connaught Place", slug: "connaught-place", pincode: "110001", lat: 28.6315, lng: 77.2167 },
      { name: "Saket", slug: "saket", pincode: "110017", lat: 28.5245, lng: 77.2066 },
      { name: "Dwarka", slug: "dwarka", pincode: "110075", lat: 28.5921, lng: 77.0460 },
    ],
  },
  {
    name: "Pune",
    slug: "pune",
    state: "Maharashtra",
    lat: 18.5204,
    lng: 73.8567,
    localities: [
      { name: "Koregaon Park", slug: "koregaon-park", pincode: "411001", lat: 18.5362, lng: 73.8938 },
      { name: "Baner", slug: "baner", pincode: "411045", lat: 18.5590, lng: 73.7868 },
      { name: "Kothrud", slug: "kothrud", pincode: "411038", lat: 18.5074, lng: 73.8077 },
    ],
  },
  {
    name: "Hyderabad",
    slug: "hyderabad",
    state: "Telangana",
    lat: 17.385,
    lng: 78.4867,
    localities: [
      { name: "Banjara Hills", slug: "banjara-hills", pincode: "500034", lat: 17.4156, lng: 78.4347 },
      { name: "Hitech City", slug: "hitech-city", pincode: "500081", lat: 17.4435, lng: 78.3772 },
    ],
  },
  {
    name: "Chennai",
    slug: "chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    localities: [
      { name: "T Nagar", slug: "t-nagar", pincode: "600017", lat: 13.0418, lng: 80.2341 },
      { name: "Adyar", slug: "adyar", pincode: "600020", lat: 13.0012, lng: 80.2565 },
    ],
  },
];

const amenities = [
  { name: "WiFi", slug: "wifi", icon: "📶" },
  { name: "Parking", slug: "parking", icon: "🅿️" },
  { name: "Air Conditioning", slug: "air-conditioning", icon: "❄️" },
  { name: "Wheelchair Accessible", slug: "wheelchair-accessible", icon: "♿" },
  { name: "Home Delivery", slug: "home-delivery", icon: "🛵" },
  { name: "Outdoor Seating", slug: "outdoor-seating", icon: "🌤️" },
  { name: "Card Payment", slug: "card-payment", icon: "💳" },
  { name: "Pet Friendly", slug: "pet-friendly", icon: "🐶" },
  { name: "CCTV", slug: "cctv", icon: "📹" },
  { name: "Power Backup", slug: "power-backup", icon: "🔋" },
];

async function main() {
  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon },
    });

    for (const sub of cat.subcategories ?? []) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, parentId: parent.id },
        create: { name: sub.name, slug: sub.slug, parentId: parent.id },
      });
    }
  }
  console.log(`Seeded ${categories.length} categories.`);

  for (const city of cities) {
    const dbCity = await prisma.city.upsert({
      where: { slug: city.slug },
      update: { name: city.name, state: city.state, lat: city.lat, lng: city.lng },
      create: { name: city.name, slug: city.slug, state: city.state, lat: city.lat, lng: city.lng },
    });

    for (const loc of city.localities) {
      await prisma.locality.upsert({
        where: { cityId_slug: { cityId: dbCity.id, slug: loc.slug } },
        update: { name: loc.name, pincode: loc.pincode, lat: loc.lat, lng: loc.lng },
        create: {
          cityId: dbCity.id,
          name: loc.name,
          slug: loc.slug,
          pincode: loc.pincode,
          lat: loc.lat,
          lng: loc.lng,
        },
      });
    }
  }
  console.log(`Seeded ${cities.length} cities and their localities.`);

  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { slug: amenity.slug },
      update: { name: amenity.name, icon: amenity.icon },
      create: amenity,
    });
  }
  console.log(`Seeded ${amenities.length} amenities.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
