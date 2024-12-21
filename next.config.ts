import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	webpack: (config) => {
		config.externals.push("@libsql/client");
		return config;
	},
	experimental: {
		authInterrupts: true,
	  },
};

export default nextConfig;
