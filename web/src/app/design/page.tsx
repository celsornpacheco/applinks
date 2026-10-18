import type { Metadata } from "next";
import { Showcase } from "./showcase";

export const metadata: Metadata = { title: "Sistema de design" };

export default function DesignPage() {
  return <Showcase />;
}
