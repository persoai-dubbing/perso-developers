"use client";

import { CodeBlock } from "@/components/portal/code-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Key, Timer } from "lucide-react";

export default function AuthenticationPage() {
  return (
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Authentication
              </h1>
              <p className="text-muted-foreground text-lg">
                The Perso API uses API Key based authentication. Every API
                request must include a valid API Key.
              </p>
            </div>

            <div className="space-y-6">
              {/* API Key Overview */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    API Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    You need an API Key to access the Perso API. You can generate
                    one from the{" "}
                    <a
                      href="/api-keys"
                      className="text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      API Keys
                    </a>{" "}
                    page.
                  </p>
                  <p className="text-muted-foreground">
                    Include your API Key in the{" "}
                    <code className="rounded bg-secondary px-1.5 py-0.5 text-sm font-mono text-foreground">
                      XP-API-KEY
                    </code>{" "}
                    HTTP header with every request to authenticate.
                  </p>

                  <div className="rounded-lg bg-secondary/50 border border-border p-4">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-2.5 pr-4 font-medium text-foreground whitespace-nowrap">
                            Header Name
                          </td>
                          <td className="py-2.5">
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              XP-API-KEY
                            </code>
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2.5 pr-4 font-medium text-foreground whitespace-nowrap">
                            Value
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            Your issued API Key (e.g.{" "}
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              pk_live_xxxxxxxxxxxxxxxxxxxx
                            </code>
                            )
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pr-4 font-medium text-foreground whitespace-nowrap">
                            Required
                          </td>
                          <td className="py-2.5">
                            <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20">
                              Required
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Examples */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Examples
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">cURL</Badge>
                    </div>
                    <CodeBlock
                      id="auth-curl"
                      language="bash"
                      code={`curl -X GET https://api.perso.ai/video-translator/api/v1/languages \\
  -H "XP-API-KEY: pk_live_xxxxxxxxxxxxxxxxxxxx"`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">Node.js</Badge>
                    </div>
                    <CodeBlock
                      id="auth-nodejs"
                      language="javascript"
                      code={`const response = await fetch(
  "https://api.perso.ai/video-translator/api/v1/languages",
  {
    method: "GET",
    headers: {
      "XP-API-KEY": process.env.XP_API_KEY,
    },
  }
);

const data = await response.json();
console.log(data);`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">Python</Badge>
                    </div>
                    <CodeBlock
                      id="auth-python"
                      language="python"
                      code={`import os
import requests

response = requests.get(
    "https://api.perso.ai/video-translator/api/v1/languages",
    headers={
        "XP-API-KEY": os.environ["XP_API_KEY"],
    },
)

data = response.json()
print(data)`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Best Practices */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    Security Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                    <p className="text-sm font-medium text-amber-400 mb-1">
                      Your API Key is a secret.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Do not share it with others or expose it in any client-side
                      code (browsers, mobile apps, etc.).
                    </p>
                  </div>

                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>
                        Always use your API Key on the server side only and
                        manage it through environment variables.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>
                        Never commit your API Key to a Git repository. Add your{" "}
                        <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                          .env
                        </code>{" "}
                        file to{" "}
                        <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                          .gitignore
                        </code>
                        .
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>
                        If your API Key is compromised, immediately revoke it on
                        the{" "}
                        <a
                          href="/api-keys"
                          className="text-primary underline underline-offset-4 hover:text-primary/80"
                        >
                          API Keys
                        </a>{" "}
                        page and generate a new one.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>
                        Use separate API Keys for different purposes to make
                        security management easier.
                      </span>
                    </li>
                  </ul>

                  <div className="mt-2">
                    <CodeBlock
                      id="env-example"
                      language="bash"
                      code={`# .env
XP_API_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx

# .gitignore
.env
.env.local`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limiting */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    Rate Limiting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    API 요청은 API Key 단위로 Rate Limit이 적용됩니다. Fixed
                    Window Counter 방식으로 동작하며, Read와 Write 요청에 대해
                    별도의 한도가 적용됩니다.
                  </p>

                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/50">
                          <th className="px-4 py-3 text-left font-medium text-foreground">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">
                            HTTP Methods
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">
                            Limit
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-mono">
                              Read
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              GET
                            </code>
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            6,000 req / min
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-mono">
                              Write
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              POST
                            </code>{" "}
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              PUT
                            </code>{" "}
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              DELETE
                            </code>{" "}
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              PATCH
                            </code>
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            1,800 req / min
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Rate Limit Response Headers
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      모든 API 응답에는 현재 Rate Limit 상태를 나타내는 헤더가
                      포함됩니다.
                    </p>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/50">
                            <th className="px-4 py-3 text-left font-medium text-foreground">
                              Header
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-foreground">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-border">
                            <td className="px-4 py-3">
                              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground text-xs">
                                X-RateLimit-Limit
                              </code>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              현재 윈도우의 최대 허용 요청 수
                            </td>
                          </tr>
                          <tr className="border-t border-border">
                            <td className="px-4 py-3">
                              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground text-xs">
                                X-RateLimit-Remaining
                              </code>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              현재 윈도우에서 남은 요청 수
                            </td>
                          </tr>
                          <tr className="border-t border-border">
                            <td className="px-4 py-3">
                              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground text-xs">
                                X-RateLimit-Reset
                              </code>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              Rate Limit 윈도우가 초기화되는 시각 (Unix
                              timestamp, 초 단위)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Rate Limit 초과 시
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      한도를 초과하면{" "}
                      <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 font-mono">
                        429
                      </Badge>{" "}
                      응답과 함께 에러 코드{" "}
                      <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                        G0005
                      </code>
                      가 반환됩니다.{" "}
                      <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground text-xs">
                        X-RateLimit-Reset
                      </code>{" "}
                      헤더의 시각까지 대기 후 재시도하세요.
                    </p>
                    <CodeBlock
                      id="rate-limit-response"
                      language="json"
                      code={`// 429 Too Many Requests
{
  "code": "G0005",
  "message": "요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
  "status": "TOO_MANY_REQUESTS"
}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Error Responses */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Authentication Error Responses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    인증 실패 시 아래의 에러 코드와 함께 JSON 응답이 반환됩니다.
                  </p>

                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/50">
                          <th className="px-4 py-3 text-left font-medium text-foreground">
                            Status Code
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">
                            Error Code
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-border">
                          <td className="px-4 py-3">
                            <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20 font-mono">
                              404
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              A0009
                            </code>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            API 키를 찾을 수 없습니다
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="px-4 py-3">
                            <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20 font-mono">
                              401
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              A0010
                            </code>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            유효하지 않은 API 키입니다
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="px-4 py-3">
                            <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20 font-mono">
                              401
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              A0011
                            </code>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            만료되거나 비활성화된 API 키입니다
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="px-4 py-3">
                            <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20 font-mono">
                              403
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground" colSpan={2}>
                            API Key does not have access to the requested
                            resource
                          </td>
                        </tr>
                        <tr className="border-t border-border">
                          <td className="px-4 py-3">
                            <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 font-mono">
                              429
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
                              G0005
                            </code>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            Rate limit exceeded
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Error Response Format
                    </h4>
                    <CodeBlock
                      id="auth-error-response"
                      language="json"
                      code={`{
  "code": "A0011",
  "message": "만료되거나 비활성화된 API 키입니다.",
  "status": "UNAUTHORIZED"
}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
  );
}
