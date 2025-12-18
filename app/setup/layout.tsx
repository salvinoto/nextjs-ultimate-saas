import { redirect } from "next/navigation";
import { getSetupStatus, isSetupAllowed } from "@/lib/setup";

export const metadata = {
  title: "Setup Wizard",
  description: "Configure your Next.js Ultimate SaaS application",
};

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only allow setup in development
  if (!isSetupAllowed()) {
    redirect("/");
  }

  // If already configured, redirect to home
  const status = getSetupStatus();
  if (status.isConfigured) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {children}
    </div>
  );
}

