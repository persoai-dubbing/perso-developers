import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Perso Developers',
  description: 'API Key Management & Usage Monitoring',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.ico',
  },
  alternates: {
    types: {
      'text/markdown': [
        { url: '/llms.txt', title: 'Perso AI — full LLM-ready API docs' },
      ],
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var rc = Node.prototype.removeChild;
  Node.prototype.removeChild = function(child) {
    if (child.parentNode !== this) return child;
    return rc.apply(this, arguments);
  };
  var ib = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function(newNode, refNode) {
    if (refNode && refNode.parentNode !== this) return newNode;
    return ib.apply(this, arguments);
  };
})();
`,
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
