import { Wrapper } from "@/components/wrapper";
import { createMetadata } from "@/lib/metadata";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Wrapper>
      {children}
    </Wrapper>
  );
}
