import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { resolve } from "path";

// Load .env.local explicitly — tsx doesn't do this automatically
config({ path: resolve(process.cwd(), ".env") });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const laptops = [
  {
    name: "MacBook Pro 14",
    brand: "Apple",
    price: 1999,
    specs: {
      cpu: "Apple M3 Pro",
      ram_gb: 18,
      storage_gb: 512,
      screen_inches: 14.2,
      battery_hours: 18,
      weight_kg: 1.61,
      gpu: "Integrated 18-core GPU",
    },
    category: "professional",
    stock: 5,
    rating: 4.8,
    tags: ["thin", "long battery", "premium", "macos"],
  },
  {
    name: "Dell XPS 15",
    brand: "Dell",
    price: 1799,
    specs: {
      cpu: "Intel Core i7-13700H",
      ram_gb: 16,
      storage_gb: 512,
      screen_inches: 15.6,
      battery_hours: 12,
      weight_kg: 1.86,
      gpu: "NVIDIA RTX 4060",
    },
    category: "professional",
    stock: 3,
    rating: 4.6,
    tags: ["gaming capable", "large screen", "windows", "powerful"],
  },
  {
    name: "ThinkPad X1 Carbon",
    brand: "Lenovo",
    price: 1499,
    specs: {
      cpu: "Intel Core i7-1365U",
      ram_gb: 16,
      storage_gb: 512,
      screen_inches: 14.0,
      battery_hours: 15,
      weight_kg: 1.12,
      gpu: "Intel Iris Xe",
    },
    category: "business",
    stock: 8,
    rating: 4.7,
    tags: ["ultralight", "business", "long battery", "windows"],
  },
  {
    name: "ASUS ROG Zephyrus G14",
    brand: "ASUS",
    price: 1599,
    specs: {
      cpu: "AMD Ryzen 9 7940HS",
      ram_gb: 32,
      storage_gb: 1024,
      screen_inches: 14.0,
      battery_hours: 10,
      weight_kg: 1.65,
      gpu: "NVIDIA RTX 4070",
    },
    category: "gaming",
    stock: 6,
    rating: 4.7,
    tags: ["gaming", "powerful", "compact", "high refresh rate"],
  },
  {
    name: "MacBook Air 15",
    brand: "Apple",
    price: 1299,
    specs: {
      cpu: "Apple M2",
      ram_gb: 8,
      storage_gb: 256,
      screen_inches: 15.3,
      battery_hours: 18,
      weight_kg: 1.51,
      gpu: "Integrated 10-core GPU",
    },
    category: "everyday",
    stock: 12,
    rating: 4.6,
    tags: ["thin", "long battery", "macos", "large screen", "value"],
  },
  {
    name: "Lenovo IdeaPad 5",
    brand: "Lenovo",
    price: 699,
    specs: {
      cpu: "AMD Ryzen 5 7530U",
      ram_gb: 16,
      storage_gb: 512,
      screen_inches: 15.6,
      battery_hours: 9,
      weight_kg: 1.79,
      gpu: "AMD Radeon Graphics",
    },
    category: "budget",
    stock: 15,
    rating: 4.3,
    tags: ["budget", "value", "windows", "everyday"],
  },
  {
    name: "HP Spectre x360 14",
    brand: "HP",
    price: 1649,
    specs: {
      cpu: "Intel Core Ultra 7",
      ram_gb: 16,
      storage_gb: 512,
      screen_inches: 14.0,
      battery_hours: 14,
      weight_kg: 1.44,
      gpu: "Intel Arc Graphics",
    },
    category: "professional",
    stock: 4,
    rating: 4.5,
    tags: ["2-in-1", "touchscreen", "premium", "windows", "thin"],
  },
  {
    name: "Razer Blade 15",
    brand: "Razer",
    price: 2499,
    specs: {
      cpu: "Intel Core i9-13950HX",
      ram_gb: 32,
      storage_gb: 1024,
      screen_inches: 15.6,
      battery_hours: 6,
      weight_kg: 2.01,
      gpu: "NVIDIA RTX 4080",
    },
    category: "gaming",
    stock: 2,
    rating: 4.5,
    tags: ["gaming", "premium", "powerful", "high refresh rate"],
  },
];

async function seed() {
  try {
    await client.connect();
    const db = client.db("ai_shop");
    const collection = db.collection("laptops");

    // Clear existing data
    await collection.deleteMany({});

    // Insert fresh seed data
    const result = await collection.insertMany(laptops);
    console.log(`✅ Seeded ${result.insertedCount} laptops`);

    // Create indexes for common queries
    await collection.createIndex({ price: 1 });
    await collection.createIndex({ "specs.ram_gb": 1 });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ brand: 1 });
    await collection.createIndex({ tags: 1 });
    console.log("✅ Indexes created");
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
