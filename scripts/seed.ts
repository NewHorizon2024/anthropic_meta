import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { resolve } from "path";

import type { Country } from "@/models/countries";

// Load .env.local explicitly — tsx doesn't do this automatically
config({ path: resolve(process.cwd(), ".env") });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const countries: Country[] = [
  {
    name: "Egypt",
    continent: "Africa",
    specs: {
      weather: "Hot",
      friendly: "People are very friendly",
      food: "Very delicious",
      sea: "It has 2 seas",
      coordinates: { latitude: "26.2540493", longitude: "29.2675469" },
    },
  },

  {
    name: "Japan",
    continent: "Asia",
    specs: {
      weather: "Varies by region, generally mild",
      friendly: "Polite and respectful culture",
      food: "World-famous cuisine",
      sea: "Surrounded by ocean",
      coordinates: { latitude: "36.204824", longitude: "138.252924" },
    },
  },

  {
    name: "Brazil",
    continent: "South America",
    specs: {
      weather: "Tropical and warm",
      friendly: "Very lively and welcoming",
      food: "Rich and diverse flavors",
      sea: "Long Atlantic coastline",
      coordinates: { latitude: "-14.235004", longitude: "-51.92528" },
    },
  },

  {
    name: "Canada",
    continent: "North America",
    specs: {
      weather: "Cold winters, mild summers",
      friendly: "Famously friendly",
      food: "Comforting and hearty",
      sea: "Atlantic, Pacific, Arctic",
      coordinates: { latitude: "56.130366", longitude: "-106.346771" },
    },
  },

  {
    name: "Australia",
    continent: "Australia",
    specs: {
      weather: "Warm and sunny",
      friendly: "Relaxed and open",
      food: "Fresh and multicultural",
      sea: "Surrounded by ocean",
      coordinates: { latitude: "-25.274398", longitude: "133.775136" },
    },
  },

  {
    name: "France",
    continent: "Europe",
    specs: {
      weather: "Mild and varied",
      friendly: "Warm once you connect",
      food: "World-class cuisine",
      sea: "Mediterranean & Atlantic",
      coordinates: { latitude: "46.227638", longitude: "2.213749" },
    },
  },

  {
    name: "South Africa",
    continent: "Africa",
    specs: {
      weather: "Sunny and warm",
      friendly: "Very welcoming",
      food: "Rich and flavorful",
      sea: "Atlantic & Indian",
      coordinates: { latitude: "-30.559482", longitude: "22.937506" },
    },
  },

  {
    name: "India",
    continent: "Asia",
    specs: {
      weather: "Hot and humid",
      friendly: "Warm and expressive",
      food: "Extremely diverse",
      sea: "Indian Ocean coastline",
      coordinates: { latitude: "20.593684", longitude: "78.96288" },
    },
  },

  {
    name: "Argentina",
    continent: "South America",
    specs: {
      weather: "Varied climate",
      friendly: "Passionate and warm",
      food: "Famous for beef dishes",
      sea: "Atlantic coastline",
      coordinates: { latitude: "-38.416097", longitude: "-63.616672" },
    },
  },

  {
    name: "Mexico",
    continent: "North America",
    specs: {
      weather: "Warm and tropical",
      friendly: "Very hospitable",
      food: "Spicy and iconic",
      sea: "Pacific & Gulf of Mexico",
      coordinates: { latitude: "23.634501", longitude: "-102.552784" },
    },
  },

  {
    name: "New Zealand",
    continent: "Australia",
    specs: {
      weather: "Mild and oceanic",
      friendly: "Extremely friendly",
      food: "Fresh and natural",
      sea: "Surrounded by ocean",
      coordinates: { latitude: "-40.900557", longitude: "174.885971" },
    },
  },

  {
    name: "Germany",
    continent: "Europe",
    specs: {
      weather: "Cool and temperate",
      friendly: "Direct but kind",
      food: "Hearty and traditional",
      sea: "North & Baltic Sea",
      coordinates: { latitude: "51.165691", longitude: "10.451526" },
    },
  },

  {
    name: "Kenya",
    continent: "Africa",
    specs: {
      weather: "Warm and tropical",
      friendly: "Very welcoming",
      food: "Rich and flavorful",
      sea: "Indian Ocean",
      coordinates: { latitude: "-0.023559", longitude: "37.906193" },
    },
  },

  {
    name: "China",
    continent: "Asia",
    specs: {
      weather: "Varied climate",
      friendly: "Respectful culture",
      food: "Extremely diverse",
      sea: "Pacific coastline",
      coordinates: { latitude: "35.86166", longitude: "104.195397" },
    },
  },

  {
    name: "Chile",
    continent: "South America",
    specs: {
      weather: "Varied, long coastline",
      friendly: "Warm and polite",
      food: "Seafood-rich cuisine",
      sea: "Pacific Ocean",
      coordinates: { latitude: "-35.675147", longitude: "-71.542969" },
    },
  },

  {
    name: "United States",
    continent: "North America",
    specs: {
      weather: "All climates",
      friendly: "Varies by region",
      food: "Multicultural",
      sea: "Atlantic & Pacific",
      coordinates: { latitude: "37.09024", longitude: "-95.712891" },
    },
  },

  {
    name: "Indonesia",
    continent: "Asia",
    specs: {
      weather: "Hot and humid",
      friendly: "Very warm culture",
      food: "Spicy and rich",
      sea: "Thousands of islands",
      coordinates: { latitude: "-0.789275", longitude: "113.921327" },
    },
  },

  {
    name: "Italy",
    continent: "Europe",
    specs: {
      weather: "Mediterranean",
      friendly: "Warm and expressive",
      food: "Legendary cuisine",
      sea: "Mediterranean Sea",
      coordinates: { latitude: "41.87194", longitude: "12.56738" },
    },
  },

  {
    name: "Morocco",
    continent: "Africa",
    specs: {
      weather: "Hot and dry",
      friendly: "Very hospitable",
      food: "Aromatic and rich",
      sea: "Atlantic & Mediterranean",
      coordinates: { latitude: "31.791702", longitude: "-7.09262" },
    },
  },

  {
    name: "Philippines",
    continent: "Asia",
    specs: {
      weather: "Tropical",
      friendly: "Extremely friendly",
      food: "Sweet and savory",
      sea: "Archipelago with many seas",
      coordinates: { latitude: "12.879721", longitude: "121.774017" },
    },
  },
];

async function seed() {
  try {
    await client.connect();
    const db = client.db("travel_guide");
    const collection = db.collection("countries");

    // Clear existing data
    await collection.deleteMany({});

    // Insert fresh seed data
    const result = await collection.insertMany(countries);
    console.log(`✅ Seeded ${result.insertedCount} countries`);

    // Create indexes for common queries
    await collection.createIndex({ "specs.weather": 1 });
    await collection.createIndex({ "specs.friendly": 1 });
    await collection.createIndex({ "specs.food": 1 });
    await collection.createIndex({ "specs.sea": 1 });
    await collection.createIndex({ "specs.coordinates": 1 });
    console.log("✅ Indexes created");
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
