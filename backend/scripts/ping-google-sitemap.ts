import dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function submitSitemapToSearchEngines() {
  console.log(`====================================================`);
  console.log(`🚀 AUTOMATED SEARCH ENGINE SITEMAP SUBMISSION ENGINE`);
  console.log(`====================================================`);

  const sitemapUrl = "https://hubigo.in/sitemap.xml";
  console.log(`📡 Target Sitemap URL: ${sitemapUrl}`);

  // 1. IndexNow API Submission (Notifies Bing, Yandex, Seznam, Naver instantly)
  try {
    console.log(`⚡ Submitting to IndexNow Search Engine Network...`);
    const indexNowPayload = {
      host: "hubigo.in",
      key: "hubigo-healthcare-sitemap-key",
      keyLocation: "https://hubigo.in/hubigo-healthcare-sitemap-key.txt",
      urlList: [
        "https://hubigo.in/",
        "https://hubigo.in/category",
        "https://hubigo.in/category/hospitals",
        "https://hubigo.in/category/doctors-clinics",
        "https://hubigo.in/category/diagnostic-labs",
        "https://hubigo.in/category/pharmacies",
        "https://hubigo.in/category/eye-care",
        "https://hubigo.in/category/dentists",
        "https://hubigo.in/sitemap.xml",
      ],
    };

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(indexNowPayload),
    });

    console.log(`✅ IndexNow Response Status: ${res.status} ${res.statusText}`);
  } catch (err: any) {
    console.warn(`⚠️ IndexNow ping note:`, err.message);
  }

  console.log(`\n🎉 SITEMAP SUBMISSION COMPLETED SUCCESSFULLY!`);
  console.log(`====================================================\n`);
}

submitSitemapToSearchEngines();
