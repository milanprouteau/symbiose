import type { Metadata } from "next";
import data from "@/data/draft_2024_comparison.json";
import DraftTable from "@/app/draft2025/DraftTable";

export const metadata: Metadata = {
  title: "Draft 2024 — SisPx prédit vs réel",
  robots: { index: false, follow: false },
};

export default function Draft2024Page() {
  return <DraftTable data={data} year={2024} mae={14.5} corr={0.35} />;
}
