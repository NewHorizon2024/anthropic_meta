import Anthropic from "@anthropic-ai/sdk";

import { getDb } from "@/lib/mongodb";

// ============================================================
// TOOL DEFINITIONS
// Applying the 6 principles:
// 1. Verb-noun names
// 2. WHEN to use each tool
// 3. Explicit disambiguation between similar tools
// 4. Document return shape
// 5. Enums for fixed values
// 6. Structured error returns
// ============================================================

export const tools: Anthropic.Tool[] = [
  {
    name: "search_laptops",
    description: `Search and filter laptops from the database.
Use this when the user wants to BROWSE or has VAGUE requirements
— for example: "show me gaming laptops", "what's under $1000",
"I need something lightweight".

Do NOT use this for specific laptop lookups by name — use get_laptop_details instead.

Filters are all optional — omit any you don't need.
Returns: array of laptops with name, brand, price, category, rating, stock, and key specs.
Returns empty array if no laptops match the filters.`,
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description: "Filter by use case category",
          enum: ["gaming", "professional", "business", "everyday", "budget"],
        },
        max_price: {
          type: "number",
          description: "Maximum price in USD",
        },
        min_price: {
          type: "number",
          description: "Minimum price in USD",
        },
        min_ram_gb: {
          type: "number",
          description: "Minimum RAM in gigabytes",
        },
        max_weight_kg: {
          type: "number",
          description:
            "Maximum weight in kilograms — use for portability requirements",
        },
        min_battery_hours: {
          type: "number",
          description: "Minimum battery life in hours",
        },
        brand: {
          type: "string",
          description: "Filter by brand",
          enum: ["Apple", "Dell", "Lenovo", "ASUS", "HP", "Razer"],
        },
        tag: {
          type: "string",
          description: "Filter by tag for fuzzy requirements",
          enum: [
            "thin",
            "long battery",
            "premium",
            "macos",
            "windows",
            "gaming",
            "powerful",
            "ultralight",
            "business",
            "budget",
            "value",
            "2-in-1",
            "touchscreen",
            "high refresh rate",
          ],
        },
        limit: {
          type: "number",
          description:
            "Maximum number of results to return. Default 5, max 10.",
        },
      },
      required: [],
    },
  },

  {
    name: "get_laptop_details",
    description: `Get COMPLETE details for a SPECIFIC laptop by name.
Use this when the user asks about a specific laptop by name
— for example: "tell me more about the MacBook Pro 14",
"what are the full specs of the XPS 15?".

Do NOT use for browsing or filtering — use search_laptops instead.

Returns: full specs object including cpu, ram, storage, screen size,
battery, weight, gpu, stock count, rating, price, tags, and category.
Returns { error: "not_found" } if no laptop matches the name.`,
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: `Laptop name or partial name to look up.
Case insensitive. Examples: "MacBook Pro", "XPS 15", "ThinkPad"`,
        },
      },
      required: ["name"],
    },
  },

  {
    name: "compare_laptops",
    description: `Compare two or more laptops side by side.
Use this when the user explicitly wants to COMPARE laptops
— for example: "compare the MacBook and the Dell XPS",
"which is better, the ROG or the Razer?",
"help me decide between these two".

Returns a structured comparison of specs, price, pros/cons for each laptop.
Returns { error: "not_found", missing: [...] } if any laptop name isn't found.`,
    input_schema: {
      type: "object" as const,
      properties: {
        names: {
          type: "array",
          items: { type: "string" },
          description: `Array of laptop names to compare. Minimum 2, maximum 4.
Examples: ["MacBook Pro 14", "Dell XPS 15"] or ["ROG Zephyrus", "Razer Blade 15"]`,
        },
      },
      required: ["names"],
    },
  },

  {
    name: "get_recommendation",
    description: `Get a personalized laptop recommendation based on user needs.
Use this when the user describes their USE CASE or NEEDS
rather than asking about specific laptops
— for example: "what laptop should I buy for video editing?",
"I'm a developer who travels a lot, what do you recommend?",
"best laptop for a student on a budget?".

Do NOT use just because the user asks a general question.
Only use when there's enough context about their needs to make a real recommendation.

Returns: top 1-3 recommended laptops with reasoning for each recommendation.`,
    input_schema: {
      type: "object" as const,
      properties: {
        use_case: {
          type: "string",
          description: "What the user primarily needs the laptop for",
        },
        budget_usd: {
          type: "number",
          description: "Maximum budget in USD — omit if not mentioned",
        },
        priorities: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "battery life",
              "performance",
              "portability",
              "screen size",
              "value for money",
              "build quality",
              "gaming capability",
            ],
          },
          description: "What the user cares most about, in order of importance",
        },
      },
      required: ["use_case"],
    },
  },
];

// ============================================================
// TOOL IMPLEMENTATIONS
// Each function queries MongoDB directly
// Always returns a string (JSON) — never throws
// ============================================================

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  // Log every tool call for debugging
  console.log(`[Tool] ${name}`, JSON.stringify(input, null, 2));

  try {
    const db = await getDb();
    const collection = db.collection("laptops");

    switch (name) {
      case "search_laptops": {
        const filter: Record<string, unknown> = {};

        if (input.category) filter.category = input.category;
        if (input.brand) filter.brand = input.brand;
        if (input.tag) filter.tags = input.tag;

        // Price range
        if (input.min_price || input.max_price) {
          filter.price = {};
          if (input.min_price)
            (filter.price as Record<string, number>).$gte =
              input.min_price as number;
          if (input.max_price)
            (filter.price as Record<string, number>).$lte =
              input.max_price as number;
        }

        // RAM filter
        if (input.min_ram_gb) {
          filter["specs.ram_gb"] = { $gte: input.min_ram_gb };
        }

        // Weight filter (portability)
        if (input.max_weight_kg) {
          filter["specs.weight_kg"] = { $lte: input.max_weight_kg };
        }

        // Battery filter
        if (input.min_battery_hours) {
          filter["specs.battery_hours"] = { $gte: input.min_battery_hours };
        }

        const limit = Math.min((input.limit as number) || 5, 10);

        const laptops = await collection
          .find(filter)
          .sort({ rating: -1 }) // best rated first
          .limit(limit)
          .project({
            name: 1,
            brand: 1,
            price: 1,
            category: 1,
            rating: 1,
            stock: 1,
            tags: 1,
            "specs.ram_gb": 1,
            "specs.cpu": 1,
            "specs.battery_hours": 1,
            "specs.weight_kg": 1,
            "specs.screen_inches": 1,
          })
          .toArray();

        if (laptops.length === 0) {
          return JSON.stringify({
            results: [],
            message:
              "No laptops found matching those filters. Try broader criteria.",
          });
        }

        return JSON.stringify({ results: laptops, count: laptops.length });
      }

      case "get_laptop_details": {
        const laptop = await collection.findOne({
          name: { $regex: input.name as string, $options: "i" },
        });

        if (!laptop) {
          return JSON.stringify({
            error: "not_found",
            message: `No laptop found matching "${input.name}"`,
            suggestion: "Use search_laptops to browse available options",
          });
        }

        return JSON.stringify(laptop);
      }

      case "compare_laptops": {
        const names = input.names as string[];
        const laptops = await Promise.all(
          names.map((name) =>
            collection.findOne({
              name: { $regex: name, $options: "i" },
            }),
          ),
        );

        const missing = names.filter((_, i) => !laptops[i]);
        if (missing.length > 0) {
          return JSON.stringify({
            error: "not_found",
            missing,
            message: `Could not find: ${missing.join(", ")}`,
            suggestion: "Use search_laptops to find the correct laptop names",
          });
        }

        // Structure the comparison clearly for the model
        const comparison = laptops.map((laptop) => ({
          name: laptop!.name,
          brand: laptop!.brand,
          price: laptop!.price,
          rating: laptop!.rating,
          stock: laptop!.stock,
          specs: laptop!.specs,
          category: laptop!.category,
          tags: laptop!.tags,
        }));

        return JSON.stringify({ comparison });
      }

      case "get_recommendation": {
        // Build a smart query based on use case and priorities
        const filter: Record<string, unknown> = { stock: { $gt: 0 } };
        const priorities = (input.priorities as string[]) || [];

        if (input.budget_usd) {
          filter.price = { $lte: input.budget_usd };
        }

        // Map priorities to MongoDB sort/filter hints
        const sortField =
          priorities[0] === "battery life"
            ? "specs.battery_hours"
            : priorities[0] === "portability"
              ? "specs.weight_kg"
              : priorities[0] === "value for money"
                ? "price"
                : "rating";

        const sortOrder =
          sortField === "specs.weight_kg" || sortField === "price"
            ? 1 // ascending for weight and price
            : -1; // descending for battery, rating

        const candidates = await collection
          .find(filter)
          .sort({ [sortField]: sortOrder })
          .limit(3)
          .toArray();

        if (candidates.length === 0) {
          return JSON.stringify({
            error: "no_results",
            message: "No laptops found matching those requirements",
            suggestion: "Try increasing the budget or relaxing requirements",
          });
        }

        return JSON.stringify({
          use_case: input.use_case,
          priorities,
          budget_usd: input.budget_usd || "not specified",
          candidates,
        });
      }

      default:
        return JSON.stringify({
          error: "unknown_tool",
          message: `Tool "${name}" does not exist`,
        });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Tool Error] ${name}:`, message);
    return JSON.stringify({ error: "tool_error", message });
  }
}
