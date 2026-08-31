import fs from "fs";
import path from "path";
import XLSX from "xlsx";

interface MasterRecord {
  place_id: string;
  name: string;
  address: string;
  primaryType?: string;
  Type?: string;
  subcategory?: string;
  phone_number?: string;
  international_phone_number?: string;
  longitude?: number | string;
  latitude?: number | string;
  operational_hours?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  ratings?: number | string;
  reviews_count?: number | string;
  price_level?: string;
  editorial_summary?: string;
  payment_options?: string;
  accessibilityoptions?: string;
  website_url?: string;
  email?: string;
  services?: string;
}

// Absolute Non-Medical Category Blacklist
const ABSOLUTE_NON_MEDICAL_TYPES = new Set([
  "school", "furniture_store", "fitness_center", "historical_landmark", "general_contractor",
  "community_center", "condominium_complex", "body_art_service", "makeup_artist", "barber_shop",
  "beauty_salon", "hair_salon", "spa", "indian_restaurant", "south_indian_restaurant",
  "fast_food_restaurant", "restaurant", "cafe", "subway_station", "transit_station",
  "bus_station", "bus_stop", "post_office", "educational_institution", "university",
  "college", "primary_school", "secondary_school", "hindu_temple", "church", "place_of_worship",
  "mosque", "business_center", "corporate_office", "office", "real_estate_agency",
  "movie_theater", "shopping_mall", "supermarket", "grocery_store", "convenience_store",
  "clothing_store", "footwear_store", "electronics_store", "hardware_store", "store",
  "point_of_interest", "establishment", "parking_lot", "parking", "association_or_organization",
  "lodging", "resort_hotel", "hotel", "gym", "sports_complex", "stadium", "amusement_park",
  "zoo", "aquarium", "art_gallery", "museum", "library", "park", "cemetery", "funeral_home",
  "car_dealer", "car_repair", "car_wash", "gas_station", "electrician", "plumber",
  "roofing_contractor", "painter", "locksmith", "laundry", "dry_cleaning", "tailor",
  "shoe_store", "jewelry_store", "home_goods_store", "pet_store", "florist", "book_store",
  "mobile_phone_repair", "bank", "atm", "accounting", "insurance_agency", "lawyer",
  "travel_agency", "employment_agency", "storage", "moving_company"
]);

const EXPLICIT_NON_MEDICAL_NAME_PATTERNS = [
  "mattress", "mattresses", "circle", "enclave", "villa", "villas", "apartment", "apartments",
  "residency", "complex", "mall", "theater", "theatre", "microblading", "makeup", "salon",
  "academy", "training institute", "school", "college", "university", "canteen", "restaurant",
  "darshini", "bhel", "cafe", "hotel", "resort", "lodge", "post office", "subway",
  "bus stand", "bus stop", "parking", "paying guest", "pg for", "pg ladies", "pg gents"
];

const HEALTHCARE_WHITELIST_KEYWORDS = [
  "hospital", "clinic", "doctor", "dr.", "dr ", "lab", "diagnostic", "patholog",
  "pharmacy", "chemist", "optician", "optometrist", "dental", "dentist", "eye clinic", "eye hospital",
  "health", "medical", "nursing", "physio", "blood bank", "ayurved", "homeo", "derma",
  "ortho", "cardio", "neuro", "pediatric", "gynec", "cancer", "therapy", "x-ray", "scan", "hearing", "speech"
];

function isPureHealthcareRecord(item: MasterRecord): boolean {
  const name = (item.name || "").toLowerCase().trim();
  const primaryType = (item.primaryType || item.subcategory || item.Type || "").toLowerCase().trim();

  // 1. Explicitly purge mattress stores, traffic circles, enclaves, microblading academies, makeup salons
  const isExplicitNonMedicalName = EXPLICIT_NON_MEDICAL_NAME_PATTERNS.some((pattern) => name.includes(pattern));
  if (isExplicitNonMedicalName) {
    const isGenuineHospitalOrClinic = name.includes("hospital") || name.includes("diagnostic center") || name.includes("pathology lab") || name.includes("pharmacy");
    if (!isGenuineHospitalOrClinic) {
      return false;
    }
  }

  // 2. Reject if primary type is blacklisted
  if (ABSOLUTE_NON_MEDICAL_TYPES.has(primaryType)) {
    const isGenuineHospitalOrClinic = name.includes("hospital") || name.includes("diagnostic center") || name.includes("pathology lab") || name.includes("pharmacy");
    if (!isGenuineHospitalOrClinic) {
      return false;
    }
  }

  // 3. Must match valid medical category or medical keyword
  const isHealthcareType = primaryType.includes("health") || primaryType.includes("medical") || primaryType.includes("doctor") || primaryType.includes("hospital") || primaryType.includes("clinic") || primaryType.includes("pharmacy") || primaryType.includes("lab") || primaryType.includes("dentist") || primaryType.includes("physio") || primaryType.includes("optometr");
  const isHealthcareName = HEALTHCARE_WHITELIST_KEYWORDS.some((kw) => name.includes(kw));

  return isHealthcareType || isHealthcareName;
}

function cleanHealthcareMasterDataStrict() {
  const masterPath = path.resolve(__dirname, "../google-place-ids-scraped-master.json");

  if (!fs.existsSync(masterPath)) {
    console.error(`Master file missing: ${masterPath}`);
    process.exit(1);
  }

  console.log(`====================================================`);
  console.log(`🧹 ABSOLUTE HEALTHCARE MASTER DATA PURIFIER v2`);
  console.log(`====================================================`);

  const rawData: MasterRecord[] = JSON.parse(fs.readFileSync(masterPath, "utf8"));
  console.log(`📊 Loaded ${rawData.length} total scraped records.`);

  const cleanRecords: MasterRecord[] = [];
  const removedRecords: MasterRecord[] = [];

  for (const item of rawData) {
    if (isPureHealthcareRecord(item)) {
      cleanRecords.push(item);
    } else {
      removedRecords.push(item);
    }
  }

  console.log(`\n✅ 100% Pure Healthcare Records Retained: ${cleanRecords.length} (${((cleanRecords.length / rawData.length) * 100).toFixed(1)}%)`);
  console.log(`🗑️ Total Non-Healthcare Noise Removed:     ${removedRecords.length} (${((removedRecords.length / rawData.length) * 100).toFixed(1)}%)\n`);

  // Save Clean Output Files
  const outputJson = path.resolve(__dirname, "../google-place-ids-healthcare-CLEANED-master.json");
  const outputExcel = path.resolve(__dirname, "../google-place-ids-healthcare-CLEANED-master.xlsx");

  fs.writeFileSync(outputJson, JSON.stringify(cleanRecords, null, 2), "utf8");

  const worksheet = XLSX.utils.json_to_sheet(cleanRecords);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pure Healthcare Leads");
  XLSX.writeFile(workbook, outputExcel);

  console.log(`====================================================`);
  console.log(`🎉 COMPLETED ABSOLUTE DATA PURIFICATION v2!`);
  console.log(`📁 Clean Excel File: ${outputExcel}`);
  console.log(`📁 Clean JSON File:  ${outputJson}`);
  console.log(`====================================================\n`);
}

cleanHealthcareMasterDataStrict();
