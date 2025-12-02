// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'DeltaZero — Delta-neutral, funding-forward',
    description: 'Earn systematic yield from perp funding while your delta stays flat. On Supra.',
    openGraph: {
        title: 'DeltaZero — Delta-neutral, funding-forward',
        description: 'Perp funding vault on Supra. Neutral by design.',
        images: ['/brand/opengraph_1200x630.png'],
    },
    twitter: { card: 'summary_large_image', images: ['/brand/twitter_banner.png'] },
    icons: { icon: '/brand/favicon.ico' },
}

// Inject NEXT_PUBLIC_* at runtime for client pages without touching process.env on the client.
export default function RootLayout({ children }: { children: React.ReactNode }) {
    const runtimeEnv = {
        NEXT_PUBLIC_SUPRA_RPC: process.env.NEXT_PUBLIC_SUPRA_RPC || '',
        NEXT_PUBLIC_VAULT_ADDRESS: process.env.NEXT_PUBLIC_VAULT_ADDRESS || '',
        NEXT_PUBLIC_USDC_ADDRESS: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
    }

    return (
        <html lang="en">
            <body>
                {/* Makes vars available as window.__ENV__ so client components can read them safely */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `window.__ENV__ = ${JSON.stringify(runtimeEnv)};`,
                    }}
                />
                {children}
            </body>
        </html>
    )
}
