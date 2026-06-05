import type { Metadata } from "next";
import { ActressPortfolio } from "@/components/site/actress-portfolio";

export const metadata: Metadata = {
  title: "Preview | Weronika Malik",
  description: "Podgląd szkicu portfolio Weroniki Malik przed publikacją."
};

export default function PreviewPage() {
  return <ActressPortfolio />;
}
