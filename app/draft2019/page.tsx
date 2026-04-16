import type { Metadata } from "next";
import data from "@/data/draft_2019_comparison.json";
import DraftTable from "@/app/draft2025/DraftTable";

export const metadata: Metadata = {
  title: "Draft 2019 — SisPx prédit vs réel (prime)",
  robots: { index: false, follow: false },
};

export default function Draft2019Page() {
  return <DraftTable data={data} year={2019} mae={13.2} corr={0.56} />;
}
