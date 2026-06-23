import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/hub/agent", destination: "/hub", permanent: false },
      { source: "/hub/analytics", destination: "/hub/reporting", permanent: false },
      { source: "/hub/integrations", destination: "/hub/systems-health", permanent: false },
      { source: "/hub/contracts", destination: "/hub/forms", permanent: false },
      { source: "/hub/ai", destination: "/hub/coaching", permanent: false },
      { source: "/hub/ai/ask", destination: "/hub/coaching", permanent: false },
      { source: "/hub/ai/coach", destination: "/hub/coaching", permanent: false },
      { source: "/hub/ai/lead-responder", destination: "/hub/crm", permanent: false },
      { source: "/hub/ai/seller-intel", destination: "/hub/cash-offer", permanent: false },
      { source: "/hub/ai/cash-offer", destination: "/hub/cash-offer", permanent: false },
      { source: "/hub/ai/listing-writer", destination: "/hub/listing-launch", permanent: false },
      { source: "/hub/ai/marketing-kit", destination: "/hub/marketing", permanent: false },
      { source: "/hub/ai/agreements", destination: "/hub/buyer-agreements", permanent: false },
      { source: "/hub/ai/cma", destination: "/hub/reporting", permanent: false },
    ];
  },
};

export default nextConfig;
