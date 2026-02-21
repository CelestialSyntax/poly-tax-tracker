import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "exceljs", "docx"],
}

export default nextConfig
