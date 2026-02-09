import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mui/material", "@mui/system", "iconsax-react"],
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
