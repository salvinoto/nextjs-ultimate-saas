import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	webpack: (config) => {
		config.externals.push("@libsql/client");
		return config;
	},
	turbopack: {
		// Turbopack configuration for Next.js 16
		resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
	},
	experimental: {
		authInterrupts: true,
	},
	serverExternalPackages: ['@libsql/client'],
};

export default nextConfig;
