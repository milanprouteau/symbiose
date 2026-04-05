import type { Metadata } from "next";
import intermediatesData from "@/data/sis-intermediates.json";
import type { PlayerIntermediate } from "./engine";
import CalibrationTool from "./CalibrationTool";

export const metadata: Metadata = {
  title: "Calibration SIS/SIS-Px",
  robots: { index: false, follow: false },
};

export default function CalibrationPage() {
  const players = intermediatesData as PlayerIntermediate[];
  return <CalibrationTool players={players} />;
}
