/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Removed 'output: standalone' - not needed for Vercel deployment
    async redirects() {
        return [
            { source: '/whitepaper', destination: '/docs/SupraHedge_Whitepaper.pdf', permanent: true },
            { source: '/deck', destination: '/docs/SupraHedge_Investor_Deck.pdf', permanent: true },
            { source: '/terms', destination: '/docs/SupraHedge_Terms.pdf', permanent: true }
        ];
    },
};

export default nextConfig;