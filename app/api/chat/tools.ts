import Anthropic from "@anthropic-ai/sdk";

// --- Tool Definitions ---
// These are what you send to the model — it reads the descriptions
// to understand what each tool does and when to use it.
// The description quality directly affects how well the model uses the tool.

export const tools: Anthropic.Tool[] = [
  {
    name: "get_product",
    description:
      "Get details about a specific product by name. " +
      "Use this when the user asks about a specific product.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "The product name to look up"
        }
      },
      required: ["name"]
    }
  },
  {
    name: "list_products",
    description:
      "List all available products, optionally filtered by category. " +
      "Use this when the user asks what products are available " +
      "or wants to browse by category.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description: "Optional category to filter by: 'laptops', 'phones', 'accessories'",
          enum: ["laptops", "phones", "accessories"]
        }
      },
      required: []
    }
  },
  {
    name: "check_stock",
    description:
      "Check if a product is in stock and how many units are available. " +
      "Use this when the user asks about availability.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_id: {
          type: "string",
          description: "The product ID to check stock for"
        }
      },
      required: ["product_id"]
    }
  }
];

// --- Fake Database ---
// In a real product this would be your actual DB queries,
// REST API calls, or any other backend logic

const products = [
  { id: "p1", name: "MacBook Pro 14", category: "laptops", price: 1999, stock: 5 },
  { id: "p2", name: "iPhone 16 Pro", category: "phones", price: 1099, stock: 12 },
  { id: "p3", name: "AirPods Pro", category: "accessories", price: 249, stock: 30 },
  { id: "p4", name: "Dell XPS 15", category: "laptops", price: 1799, stock: 3 },
  { id: "p5", name: "Samsung Galaxy S25", category: "phones", price: 999, stock: 8 },
];

// --- Tool Implementations ---
// The actual functions that run when the model calls a tool

export function executeTool(
  name: string,
  input: Record<string, string>
): string {
  switch (name) {
    case "get_product": {
      const product = products.find(p =>
        p.name.toLowerCase().includes(input.name.toLowerCase())
      );
      if (!product) return JSON.stringify({ error: "Product not found" });
      return JSON.stringify(product);
    }

    case "list_products": {
      const filtered = input.category
        ? products.filter(p => p.category === input.category)
        : products;
      return JSON.stringify(filtered);
    }

    case "check_stock": {
      const product = products.find(p => p.id === input.product_id);
      if (!product) return JSON.stringify({ error: "Product not found" });
      return JSON.stringify({
        product_id: product.id,
        name: product.name,
        in_stock: product.stock > 0,
        units_available: product.stock
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}