"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiAgentBanner } from "@/components/portal/ai-agent-banner";
import {
  Book,
  Key,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function DocsPage() {
  return (
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <AiAgentBanner />
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Perso AI Developer Documentation
              </h1>
              <p className="text-muted-foreground text-lg">
                Integrate powerful AI capabilities into your applications
                with the Perso AI API.
              </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-secondary border border-border">
                <TabsTrigger value="overview" className="gap-2">
                  <Book className="h-4 w-4" />
                  Overview
                </TabsTrigger>
<TabsTrigger value="api-keys" className="gap-2">
                  <Key className="h-4 w-4" />
                  API Keys
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Base URL & LLM Docs */}
                <Card className="bg-card border-border cursor-default">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-secondary rounded-lg p-4 border border-border">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          API Base URL
                        </h4>
                        <code className="text-sm font-mono text-primary">
                          https://api.perso.ai
                        </code>
                        <p className="text-xs text-muted-foreground mt-1">
                          All API requests use this base URL. perso-storage paths in responses use https://portal-media.perso.ai.
                        </p>
                      </div>
                      <div className="bg-secondary rounded-lg p-4 border border-border">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          LLM / AI Agent Docs
                        </h4>
                        <code className="text-sm font-mono text-primary break-all">
                          /llms.txt
                        </code>
                        <p className="text-xs text-muted-foreground mt-1">
                          Full spec in one markdown file. Point your LLM (Cursor, Claude Code, etc.) at this URL.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border cursor-default">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Book className="h-5 w-5 text-primary" />
                      What is Perso AI?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-foreground leading-relaxed">
                      <strong>Perso AI</strong> is a next-generation AI API
                      platform designed to help developers easily integrate
                      AI capabilities into their applications.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-secondary rounded-lg p-4 border border-border">
                        <h4 className="font-semibold text-foreground mb-2">
                          Natural Language Processing
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Various NLP features including text analysis, sentiment analysis, summarization, and translation
                        </p>
                      </div>
                      <div className="bg-secondary rounded-lg p-4 border border-border">
                        <h4 className="font-semibold text-foreground mb-2">
                          Conversational AI
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          APIs for building advanced chatbots and conversational systems
                        </p>
                      </div>
                      <div className="bg-secondary rounded-lg p-4 border border-border">
                        <h4 className="font-semibold text-foreground mb-2">
                          Content Generation
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Automated generation of text, code, image descriptions, and more
                        </p>
                      </div>
                      <div className="bg-secondary rounded-lg p-4 border border-border">
                        <h4 className="font-semibold text-foreground mb-2">
                          Data Analysis
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Unstructured data analysis and insight extraction
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border cursor-default">
                  <CardHeader>
                    <CardTitle>Key Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <strong className="text-foreground">
                            Easy Integration
                          </strong>
                          <p className="text-sm text-muted-foreground">
                            Easy to use with any language or framework via RESTful API
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <strong className="text-foreground">
                            High Availability
                          </strong>
                          <p className="text-sm text-muted-foreground">
                            99.9% SLA guarantee with global edge network
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <strong className="text-foreground">
                            Real-time Monitoring
                          </strong>
                          <p className="text-sm text-muted-foreground">
                            Real-time tracking of API usage, response times, and error rates
                          </p>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* API Keys Tab */}
              <TabsContent value="api-keys" className="space-y-6">
                <Card className="bg-card border-border cursor-default">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-primary" />
                      API Key Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">
                        What is an API Key?
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        An API Key is a unique authentication token for
                        accessing the Perso AI API. Each API Key controls
                        access permissions for specific projects or
                        environments, and is used for usage tracking and
                        security management.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <div className="bg-secondary rounded-lg p-4 border border-border">
                        <h5 className="font-semibold text-foreground mb-2">
                          Key Format
                        </h5>
                        <p className="text-sm text-muted-foreground mb-2">
                          API Keys follow this format:
                        </p>
                        <code className="text-sm bg-background px-2 py-1 rounded text-primary">
                          pk_live_xxxxxxxxxxxxxxxxxxxx
                        </code>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                          <li>
                            <code className="text-primary">pk_</code> - Perso
                            Key prefix
                          </li>
                          <li>
                            <code className="text-primary">live_</code> -
                            Production environment (test_ for test environment)
                          </li>
                          <li>Unique identifier string</li>
                        </ul>
                      </div>

                      <div className="bg-secondary rounded-lg p-4 border border-border">
                        <h5 className="font-semibold text-foreground mb-2">
                          Expiration Settings
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          You can set an expiration date on API Keys for
                          security. Expired keys are automatically deactivated
                          and a new key must be issued. Keys without an
                          expiration date remain valid until manually revoked.
                        </p>
                      </div>

                      <div className="bg-secondary rounded-lg p-4 border border-border">
                        <h5 className="font-semibold text-foreground mb-2">
                          Key Status
                        </h5>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Active
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Currently active
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Expired
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Key has expired
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Revoked
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Manually revoked
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-foreground mb-1">
                            Security Notice
                          </h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>
                              Never expose API Keys in client-side code
                            </li>
                            <li>
                              Do not commit API Keys to Git repositories
                            </li>
                            <li>
                              Use environment variables or a secret manager
                            </li>
                            <li>
                              Revoke keys immediately if suspicious activity
                              is detected
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
  );
}
