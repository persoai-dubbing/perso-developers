import { Client } from "@elastic/elasticsearch";

let client: Client | null = null;

export function getEsClient(): Client {
  if (!client) {
    const url = process.env.ELASTICSEARCH_URL;
    if (!url) {
      throw new Error("ELASTICSEARCH_URL is not configured");
    }

    const apiKey = process.env.ELASTICSEARCH_API_KEY;
    const username = process.env.ELASTICSEARCH_USERNAME;
    const password = process.env.ELASTICSEARCH_PASSWORD;

    let auth: { apiKey: string } | { username: string; password: string } | undefined;
    if (apiKey) {
      auth = { apiKey };
    } else if (username && password) {
      auth = { username, password };
    }

    client = new Client({
      node: url,
      auth,
      tls: { rejectUnauthorized: false },
    });
  }
  return client;
}

export function getIndexPattern(): string {
  return (
    process.env.ELASTICSEARCH_INDEX_PATTERN ||
    "perso-analytics-perso-api-gateway-*"
  );
}
