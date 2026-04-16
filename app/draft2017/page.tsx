import type { Metadata } from "next";
import data from "@/data/draft_2017_comparison.json";
import DraftTable from "@/app/draft2025/DraftTable";

export const metadata: Metadata = {
  title: "Draft 2017 — SisPx prédit vs réel (prime)",
  robots: { index: false, follow: false },
};

export default function Draft2017Page() {
  return <DraftTable data={data} year={2017} mae={18.1} corr={0.40} />;
}
