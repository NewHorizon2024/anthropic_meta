import Anthropic from "@anthropic-ai/sdk";

import { getDb } from "@/lib/mongodb";

export const tools: Anthropic.Tool[] = [
  {
    name: "get_countries",
    description:
      "Get list of countries and their details" +
      "Use this tool when the user asking about available countries" +
      "User can optionally give a name of continent - you can use the tool by continent filter to get only the countries in the specific continent" +
      "returns: an array of countries or empty array",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Optional name of continent that user can specify",
        },
      },
      required: [],
    },
  },
  {
    name: "get_country",
    description:
      "Get specific country by name" +
      "Use this tool if user ask about specific country" +
      "returns: an array of countries or empty array",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description:
            "required name to search the countries and get the country",
        },
      },
      required: ["name"],
    },
  },
];

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
) {
  const db = await getDb("travel_guide");
  const countries = db.collection("countries");
  try {
    switch (name) {
      case "get_countries":
        const allCountries = (await countries.find({}).toArray()).map(
          ({ name }) => name,
        );
        // console.log(allCountries);
        if (!allCountries.length) return JSON.stringify({ results: [] });
        return JSON.stringify({ results: allCountries });
      case "get_country":
        const countryName = input.name as string;
        const country = await countries.findOne({ name: countryName });
        if (country?._id) return JSON.stringify({ results: country });
        return JSON.stringify({
          error: "not_found",
          message: "no country has been found",
          suggestions:
            "Ask the user to check carefully the list of countries the service providing",
        });
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
