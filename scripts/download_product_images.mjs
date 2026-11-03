import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import mysql from "mysql2/promise";

const OUTPUT_DIR = path.resolve("public/products");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Exact product to authentic photograph URL mapping
// Each product has a distinct, high-quality, realistic image matching its specific brand and name.
export const PRODUCT_IMAGE_MAP = {
  // --- Category 1: Electronics & Computers ---
  1: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop", // Test Wireless Mouse: Ergonomic wireless optical mouse
  3: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=800&auto=format&fit=crop", // Lenovo LOQ Gaming Laptop: Modern gaming laptop with illuminated keyboard
  4: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800&auto=format&fit=crop", // HP Victus Gaming Laptop: HP sleek gaming laptop
  5: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=800&auto=format&fit=crop", // Acer Nitro V Gaming Laptop: Acer high-performance laptop
  6: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=800&auto=format&fit=crop", // ASUS TUF Gaming Laptop: Rugged gaming laptop on desk
  7: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=800&auto=format&fit=crop", // MSI Thin Gaming Laptop: Slim profile gaming notebook
  8: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?q=80&w=800&auto=format&fit=crop", // Dell Inspiron Laptop: Silver business laptop
  9: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800&auto=format&fit=crop", // Samsung Galaxy Smartphone: Samsung Galaxy device
  10: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop", // Apple iPhone 15: Natural titanium iPhone with camera system
  11: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop", // OnePlus Nord Smartphone: Modern Android smartphone in blue
  12: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop", // Sony Wireless Headphones: Premium over-ear noise-cancelling headphones
  13: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800&auto=format&fit=crop", // JBL Bluetooth Speaker: Cylindrical portable speaker
  14: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop", // Logitech Gaming Keyboard: Mechanical RGB keyboard
  15: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800&auto=format&fit=crop", // Dell Wireless Mouse: Compact wireless computer mouse
  16: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800&auto=format&fit=crop", // Samsung Smart TV: 43-inch 4K smart television display
  17: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop", // Canon DSLR Camera: Canon digital SLR camera with lens

  // --- Category 2: Fashion & Apparel ---
  18: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop", // Men Casual Jacket: Stylish men's casual jacket
  19: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop", // Men Slim Fit Jeans: Classic denim jeans
  20: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop", // Women Floral Dress: Floral print summer dress
  21: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800&auto=format&fit=crop", // Women Running Shoes: Puma athletic women's running sneakers
  22: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop", // Men Cotton Shirt: Crisp formal cotton button-down shirt
  23: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop", // Women Handbag: Structured leather women's tote handbag
  24: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop", // Men Sports T Shirt: Breathable athletic sports t-shirt
  25: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=800&auto=format&fit=crop", // Women Sneakers: Adidas style casual lifestyle sneakers
  26: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=800&auto=format&fit=crop", // Men Wrist Watch: Fastrack analog sporty wristwatch
  27: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop", // Women Sunglasses: Vogue designer women's sunglasses
  28: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop", // Men Hoodie: Classic grey/black fleece hoodie
  29: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop", // Women Kurti: Biba designer ethnic embroidered kurti
  30: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=800&auto=format&fit=crop", // Leather Wallet: Genuine brown leather bifold wallet
  31: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=800&auto=format&fit=crop", // Men Formal Shoes: Bata classic polished Oxford formal shoes
  32: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop", // Women Denim Jacket: Levis classic blue denim jacket

  // --- Category 3: Home & Kitchen ---
  33: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?q=80&w=800&auto=format&fit=crop", // Smart Coffee Maker: Philips drip coffee machine with glass carafe
  34: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?q=80&w=800&auto=format&fit=crop", // Prestige Pressure Cooker: Stainless steel pressure cooker
  35: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop", // Philips Air Fryer: Modern black digital air fryer
  36: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=800&auto=format&fit=crop", // LG Microwave Oven: Stainless steel countertop microwave
  37: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?q=80&w=800&auto=format&fit=crop", // Bajaj Mixer Grinder: Kitchen food processor mixer with jars
  38: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?q=80&w=800&auto=format&fit=crop", // Havells Electric Kettle: Stainless steel fast boil electric kettle
  39: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800&auto=format&fit=crop", // Milton Water Bottle: Insulated stainless steel thermos flask
  40: "https://images.unsplash.com/photo-1615865417491-9941019fbc00?q=80&w=800&auto=format&fit=crop", // Cello Dinner Set: White ceramic dinner plates & bowl set
  41: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop", // Wakefit Pillow: Ergonomic white sleeping memory foam pillow
  42: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop", // Prestige Nonstick Cookware: Black nonstick frying pan skillet
  43: "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=800&auto=format&fit=crop", // Dyson Vacuum Cleaner: Dyson cordless stick vacuum cleaner
  44: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=800&auto=format&fit=crop", // Usha Ceiling Fan: Modern 3-blade white ceiling fan
  45: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop", // IKEA Table Lamp: Minimalist bedside Scandinavian table lamp
  46: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=800&auto=format&fit=crop", // Godrej Refrigerator: Double-door stainless steel refrigerator
  47: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop", // Pigeon Induction Cooktop: Glass-ceramic touch induction cooktop

  // --- Category 4: Books & Literature ---
  48: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop", // Database Management Systems: Academic CS textbook on desk
  49: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop", // Python Programming Guide: Programming reference manual with code
  50: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop", // Let Us C: Classic C programming computer book
  51: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop", // Java Complete Reference: Comprehensive software engineering book
  52: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop", // Clean Code: Clean code software craft book
  53: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop", // Computer Networks: Networking & infrastructure book
  54: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop", // Operating System Concepts: Operating systems textbook
  55: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop", // Artificial Intelligence: AI modern approach book cover
  56: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=800&auto=format&fit=crop", // The Alchemist: Fiction philosophical novel
  57: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop", // Atomic Habits: Personal productivity & habit book
  58: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?q=80&w=800&auto=format&fit=crop", // Rich Dad Poor Dad: Personal finance and investing bestseller
  59: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop", // Think and Grow Rich: Classic success literature book
  60: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop", // Data Structures and Algorithms: Computer algorithms textbook
  61: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop", // Introduction to SQL: Database queries guide
  62: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800&auto=format&fit=crop", // The Psychology of Money: Financial psychology book

  // --- Category 5: Beauty & Personal Care ---
  63: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?q=80&w=800&auto=format&fit=crop", // Lakme Foundation: Liquid cosmetic foundation bottle
  64: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=800&auto=format&fit=crop", // Maybelline Mascara: Black volume mascara wand & tube
  65: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop", // Nivea Moisturizer: Daily moisturizing body lotion bottle
  66: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800&auto=format&fit=crop", // Mamaearth Face Wash: Gentle botanical squeeze tube face wash
  67: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop", // Minimalist Vitamin C Serum: Amber glass dropper skincare serum
  68: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=800&auto=format&fit=crop", // Neutrogena Sunscreen: SPF broad spectrum sunscreen tube
  69: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=800&auto=format&fit=crop", // Dove Shampoo: Nourishing white shampoo bottle
  70: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop", // LOréal Hair Serum: Extraordinary golden hair serum oil bottle
  71: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=800&auto=format&fit=crop", // Himalaya Face Cream: Herbal nourishing facial cream jar
  72: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=800&auto=format&fit=crop", // Nykaa Lipstick: Matte velvet lipstick bullet
  73: "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop", // The Body Shop Body Butter: Rich moisturizing body butter tub
  74: "https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=800&auto=format&fit=crop", // Biotique Face Scrub: Exfoliating botanical face scrub
  75: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=800&auto=format&fit=crop", // Cetaphil Cleanser: Gentle dermatological skin cleanser pump
  76: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=800&auto=format&fit=crop", // Plum Green Tea Toner: Clear refreshing facial toner bottle
  77: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=800&auto=format&fit=crop", // Colorbar Nail Polish: Glossy nail lacquer glass bottle
};

// Helper to download an image with redirect following
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith("https") ? https : http;

    const request = (currentUrl) => {
      client
        .get(
          currentUrl,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          },
          (response) => {
            if (
              response.statusCode >= 300 &&
              response.statusCode < 400 &&
              response.headers.location
            ) {
              return request(response.headers.location);
            }

            if (response.statusCode !== 200) {
              file.close();
              fs.unlink(destPath, () => {});
              return reject(
                new Error(`HTTP ${response.statusCode} for ${currentUrl}`)
              );
            }

            response.pipe(file);

            file.on("finish", () => {
              file.close(() => resolve(destPath));
            });
          }
        )
        .on("error", (err) => {
          file.close();
          fs.unlink(destPath, () => {});
          reject(err);
        });
    };

    request(url);
  });
}

async function main() {
  console.log("=== IntelliShop Product Image Downloader & Syncer ===");
  const productIds = Object.keys(PRODUCT_IMAGE_MAP).map(Number);
  console.log(`Starting download for ${productIds.length} products...`);

  let downloadedCount = 0;
  let failedCount = 0;

  for (const id of productIds) {
    const url = PRODUCT_IMAGE_MAP[id];
    const filename = `product-${id}.jpg`;
    const destPath = path.join(OUTPUT_DIR, filename);

    try {
      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 2000) {
        console.log(`[EXISTS] Product ${id}: ${filename}`);
        downloadedCount++;
      } else {
        process.stdout.write(`[DOWNLOADING] Product ${id} ... `);
        await downloadImage(url, destPath);
        const size = fs.statSync(destPath).size;
        console.log(`✓ Saved (${Math.round(size / 1024)} KB)`);
        downloadedCount++;
      }
    } catch (err) {
      console.log(`✕ Failed: ${err.message}`);
      failedCount++;
    }
  }

  console.log(`\nDownload completed: ${downloadedCount} succeeded, ${failedCount} failed.`);

  // Update MySQL database image_url column
  try {
    console.log("\nConnecting to MySQL to update product image_url column...");
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    let updatedDbCount = 0;
    for (const id of productIds) {
      const filename = `product-${id}.jpg`;
      const localFilePath = path.join(OUTPUT_DIR, filename);
      if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 1000) {
        const publicUrl = `/products/${filename}`;
        await conn.execute(
          "UPDATE product SET image_url = ? WHERE product_id = ?",
          [publicUrl, id]
        );
        updatedDbCount++;
      }
    }

    console.log(`Successfully updated ${updatedDbCount} products in MySQL database.`);
    await conn.end();
  } catch (dbErr) {
    console.error("Database update error:", dbErr.message);
  }
}

main();
