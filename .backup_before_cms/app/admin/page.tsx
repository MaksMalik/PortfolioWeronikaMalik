import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/admin-panel";

export const metadata: Metadata = {
  title: "Admin | Weronika Malik",
  description: "Panel edycji treści portfolio Weroniki Malik."
};

export default function AdminPage() {
  return <AdminPanel />;
}
