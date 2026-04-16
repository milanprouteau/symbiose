import type { Metadata } from "next";
import data from "@/data/draft_2018_comparison.json";
import DraftTable from "@/app/draft2025/DraftTable";

export const metadata: Metadata = {
  title: "Draft 2018 — SisPx prédit vs réel (prime)",
  robots: { index: false, follow: false },
};

export default function Draft2018Page() {
  return <DraftTable data={data} year={2018} mae={14.3} corr={0.52} />;
}
