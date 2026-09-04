import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateRichDescription(b: any): string {
  const name = b.name.trim();
  const city = b.city?.name || "Bangalore";
  const locality = b.locality?.name || "";
  const locationText = locality ? `${locality}, ${city}` : city;

  const textForSearch = `${name} ${(b.categories || []).map((c: any) => c.category?.name).join(" ")}`.toLowerCase();

  let domain = "clinic";
  if (/dent|dental|teeth|orthodont|oral/i.test(name)) domain = "dental";
  else if (/pediatr|child|infant|baby|neonat/i.test(name)) domain = "pediatric";
  else if (/eye|ophthalm|vision|optica|cataract/i.test(name)) domain = "eye";
  else if (/diagnost|lab|patholog|scan|imaging|x-ray|mri|blood/i.test(name)) domain = "diagnostic";
  else if (/physio|rehab|physical therapy/i.test(name)) domain = "physio";
  else if (/pharma|chemist|medical store|drug/i.test(name)) domain = "pharmacy";
  else if (/gynaec|gynec|obstetr|pcod|women|maternity/i.test(name)) domain = "gynaecology";
  else if (/derma|skin|cosmet/i.test(name)) domain = "dermatology";
  else if (/orthoped|bone|joint|spine/i.test(name)) domain = "orthopedics";
  else if (/cardio|heart/i.test(name)) domain = "cardiology";
  else if (/ayurved|panchakarma|homeopath/i.test(name)) domain = "holistic";
  else if (/hospital|nursing home|multispecial/i.test(textForSearch)) domain = "hospital";
  else if (/dent|dental|teeth|orthodont|oral/i.test(textForSearch)) domain = "dental";

  let s1 = "";
  switch (domain) {
    case "dental":
      s1 = `${name} is a specialized dental healthcare clinic in ${locationText}, offering comprehensive oral treatments, root canal therapy, teeth whitening, orthodontics, and preventive dental care.`;
      break;
    case "pediatric":
      s1 = `${name} provides specialized pediatric and child healthcare services in ${locationText}, focusing on child growth monitoring, vaccinations, infant care, and pediatric consultations.`;
      break;
    case "eye":
      s1 = `${name} is a dedicated eye care center in ${locationText}, offering comprehensive vision checkups, cataract evaluations, corneal care, and advanced ophthalmic consultations.`;
      break;
    case "diagnostic":
      s1 = `${name} is an advanced diagnostic laboratory and pathology testing center in ${locationText}, equipped for blood investigations, digital X-rays, imaging services, and preventive health packages.`;
      break;
    case "physio":
      s1 = `${name} is a professional physical therapy and rehabilitation practice in ${locationText}, providing post-surgical rehab, joint mobility therapy, spine care, and sports injury recovery.`;
      break;
    case "pharmacy":
      s1 = `${name} is a reliable pharmacy and medical store located in ${locationText}, dispensing genuine prescription medications, OTC healthcare products, supplements, and clinical supplies.`;
      break;
    case "gynaecology":
      s1 = `${name} offers specialized women's health and gynaecological care in ${locationText}, focusing on prenatal checkups, PCOD management, maternity wellness, and reproductive health.`;
      break;
    case "dermatology":
      s1 = `${name} is a clinical dermatology and skin care center in ${locationText}, providing expert solutions for skin disorders, acne care, hair treatments, and cosmetic dermatology.`;
      break;
    case "orthopedics":
      s1 = `${name} is an orthopedic specialty clinic in ${locationText}, specializing in joint pain evaluation, fracture management, arthritis care, and non-surgical orthopedic therapies.`;
      break;
    case "cardiology":
      s1 = `${name} is a specialized cardiovascular health clinic in ${locationText}, offering preventive heart evaluations, ECG screenings, hypertension care, and cardiac consultations.`;
      break;
    case "holistic":
      s1 = `${name} is a holistic medical wellness center in ${locationText}, providing authentic natural therapeutic consultations, herbal medicine, and preventive wellness treatments.`;
      break;
    case "hospital":
      s1 = `${name} is a premier multispeciality hospital in ${locationText}, providing 24/7 emergency services, intensive care, specialized OPD consultations, and inpatient hospital facilities.`;
      break;
    default:
      s1 = `${name} is an established medical clinic serving patients in ${locationText}, offering personalized general physician consultations, health screenings, and family medical care.`;
  }

  let s2 = "";
  if (b.avgRating >= 4.5) {
    s2 = `Highly rated with ${b.avgRating.toFixed(1)} stars by local patients for clinical accuracy, hygienic premises, and compassionate medical care.`;
  } else if (b.avgRating > 0) {
    s2 = `Rated ${b.avgRating.toFixed(1)} stars by patients, prioritizing patient comfort, transparent guidance, and professional clinical standards.`;
  } else {
    s2 = `Maintains a patient-centric environment with structured OPD consultation timings and reliable clinical support.`;
  }

  const addressClean = b.address ? b.address.replace(/, India$/i, "").trim() : locationText;
  let s3 = `Located at ${addressClean}, it conveniently serves patients across ${locality || city} and neighboring regions.`;

  const servicesArr = (b.services || []).map((s: any) => s.name).filter(Boolean);
  const keywordsArr = (b.keywords || []).filter(Boolean);
  const combines = Array.from(new Set([...servicesArr, ...keywordsArr])).slice(0, 3);
  let s4 = combines.length > 0
    ? `Key medical services and specialties include ${combines.join(", ")}.`
    : `Patients can visit for OPD consultations, health evaluations, and expert medical advice.`;

  return `${s1}\n\n${s2} ${s3}\n\n${s4}`;
}

async function run() {
  console.log("Starting streaming batch update of listing descriptions...");
  let totalProcessed = 0;

  while (true) {
    const chunk = await prisma.business.findMany({
      where: {
        status: "approved",
        deletedAt: null,
        OR: [
          { description: { contains: "licensed" } },
          { description: null },
        ],
      },
      take: 200,
      select: {
        id: true,
        name: true,
        address: true,
        avgRating: true,
        keywords: true,
        city: { select: { name: true } },
        locality: { select: { name: true } },
        categories: { select: { category: { select: { name: true } } } },
        services: { select: { name: true } },
      },
    });

    if (chunk.length === 0) break;

    for (const b of chunk) {
      const newDesc = generateRichDescription(b);
      await prisma.business.update({
        where: { id: b.id },
        data: { description: newDesc },
      });
    }

    totalProcessed += chunk.length;
    console.log(`Processed batch of ${chunk.length}. Total updated so far: ${totalProcessed}...`);
  }

  console.log(`✅ All ${totalProcessed} listing descriptions updated with rich 3-4 line healthcare summaries!`);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error("Error updating descriptions:", err);
  process.exit(1);
});
