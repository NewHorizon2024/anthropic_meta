import Anthropic from "@anthropic-ai/sdk";

import { getDb } from "@/lib/mongodb";

export const tools: Anthropic.Tool[] = [
  {
    name: "get_countries",
    description:
      "Get a list of available travel destinations. " +
      "Use this when the user is BROWSING or asks about multiple countries " +
      "— for example: 'what destinations do you have?', " +
      "'show me countries in Asia', 'what are my options?'. " +
      "For a SPECIFIC country by name → use get_country instead. " +
      "Continent filter is optional — omit to get all countries. " +
      "Returns: array of countries with name, continent, and specs. " +
      "Returns empty array if no countries match.",
    input_schema: {
      type: "object" as const,
      properties: {
        continent: {
          type: "string",
          description: "Optional continent to filter by",
          enum: [
            "South America",
            "North America",
            "Europe",
            "Asia",
            "Africa",
            "Oceania",
          ],
        },
      },
      required: [],
    },
  },
  {
    name: "get_country",
    description:
      "Get full details for a SPECIFIC country by name. " +
      "Use this when the user asks about ONE specific country " +
      "— for example: 'tell me about Brazil', 'what is Japan like?', " +
      "'I want to visit Italy, what should I know?'. " +
      "For browsing or listing → use get_countries instead. " +
      "Returns: name, continent, coordinates (latitude/longitude), " +
      "and specs including weather, friendliness, food, and sea description. " +
      "Returns null if country is not found.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description:
            "The country name to look up. " +
            "Case insensitive. Example: 'Brazil' or 'brazil'",
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
