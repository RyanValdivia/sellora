import { Bricolage_Grotesque, DM_Sans, Instrument_Serif } from "next/font/google";

// next/font necesita literales estáticos; los nombres informativos viven en sellora.config.ts.
export const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const fontVariables = `${bricolage.variable} ${dmSans.variable} ${instrumentSerif.variable}`;
