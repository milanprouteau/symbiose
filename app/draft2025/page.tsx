import type { Metadata } from "next";
import data from "@/data/draft_2025_comparison.json";
import DraftTable from "./DraftTable";

export const metadata: Metadata = {
  title: "Draft 2025 — SisPx prédit vs réel",
  robots: { index: false, follow: false },
};

export default function Draft2025Page() {
  return <DraftTable data={data} year={2025} mae={17.4} corr={0.43} />;
}
