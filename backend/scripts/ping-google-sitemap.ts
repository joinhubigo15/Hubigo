import dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function submitSitemapToSearchEngines() {
  console.log(`====================================================`);
  console.log(`🚀 INSTANT SEARCH ENGINE INDEXING ENGINE (FINDHUBIGO.COM)`);
  console.log(`====================================================`);

  const domain = "findhubigo.com";
  const baseUrl = `https://${domain}`;
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  console.log(`📡 Target Sitemap Index URL: ${sitemapUrl}`);

  const sitemapUrls = [
    sitemapUrl,
    `${baseUrl}/sitemap-static.xml`,
    `${baseUrl}/sitemap-categories.xml`,
    `${baseUrl}/sitemap-pseo.xml`,
    `${baseUrl}/sitemap-businesses-1.xml`,
    `${baseUrl}/sitemap-businesses-2.xml`,
    `${baseUrl}/sitemap-businesses-3.xml`,
    `${baseUrl}/sitemap-businesses-4.xml`,
    `${baseUrl}/sitemap-businesses-5.xml`,
    `${baseUrl}/sitemap-businesses-6.xml`,
  ];

  const mainUrls = [
    `${baseUrl}/`,
    `${baseUrl}/category`,
    `${baseUrl}/city`,
    `${baseUrl}/search`,
    `${baseUrl}/nearby`,
    `${baseUrl}/category/hospitals`,
    `${baseUrl}/category/doctors-clinics`,
    `${baseUrl}/category/diagnostic-labs`,
    `${baseUrl}/category/pharmacies`,
    `${baseUrl}/category/dentists`,
    `${baseUrl}/category/eye-care`,
    `${baseUrl}/category/physiotherapy`,
    `${baseUrl}/category/veterinary`,
    `${baseUrl}/category/medical-equipment`,
    ...sitemapUrls,
  ];

  console.log(`⚡ Requesting instant indexing for ${mainUrls.length} pages & sitemaps on ${domain}...`);

  // IndexNow API Submission
  try {
    const indexNowPayload = {
      host: domain,
      key: "findhubigo-healthcare-sitemap-key",
      keyLocation: `${baseUrl}/findhubigo-healthcare-sitemap-key.txt`,
      urlList: mainUrls,
    };

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(indexNowPayload),
    });

    console.log(`✅ IndexNow Instant Indexing Response (${domain}): ${res.status} ${res.statusText}`);
  } catch (err: any) {
    console.warn(`⚠️ IndexNow ping note:`, err.message);
  }

  console.log(`\n🎉 INSTANT INDEXING REQUEST COMPLETED FOR FINDHUBIGO.COM!`);
  console.log(`====================================================\n`);
}

submitSitemapToSearchEngines();
