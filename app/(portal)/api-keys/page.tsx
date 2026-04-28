import { ApiKeysTable } from "@/components/portal/api-keys-table";
import { Card, CardContent } from "@/components/ui/card";

export default function ApiKeysPage() {
  return (
      <div className="space-y-6">
        <ApiKeysTable />

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-foreground mb-3">API Key Security Best Practices</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Never expose your API keys in client-side code or public repositories
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Use environment variables to store API keys securely
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Rotate your keys periodically and revoke unused keys
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Use separate keys for development and production environments
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
  );
}
