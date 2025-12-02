import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { AmplitudeCredentials } from "../types/amplitude.js";

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option("amplitude-api-key", {
    type: "string",
    description: "Amplitude API key (can also use AMPLITUDE_API_KEY env var)",
    demandOption: false
  })
  .option("amplitude-secret-key", {
    type: "string",
    description: "Amplitude secret key (can also use AMPLITUDE_SECRET_KEY env var)",
    demandOption: false
  })
  .help()
  .argv;

/**
 * Get Amplitude API credentials from command line arguments or environment variables
 * Priority: CLI arguments > Environment variables
 * @returns Amplitude credentials object
 * @throws Error if credentials are not provided
 */
export const getAmplitudeCredentials = (): AmplitudeCredentials => {
  // Try CLI arguments first, then fall back to environment variables
  const apiKey = (argv["amplitude-api-key"] as string) || process.env.AMPLITUDE_API_KEY;
  const secretKey = (argv["amplitude-secret-key"] as string) || process.env.AMPLITUDE_SECRET_KEY;
  
  if (!apiKey) {
    throw new Error("Amplitude API key is required. Provide via --amplitude-api-key argument or AMPLITUDE_API_KEY environment variable.");
  }
  
  if (!secretKey) {
    throw new Error("Amplitude secret key is required. Provide via --amplitude-secret-key argument or AMPLITUDE_SECRET_KEY environment variable.");
  }
  
  return { apiKey, secretKey };
};