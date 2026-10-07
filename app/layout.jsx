import { Exo, Macondo, Macondo_Swash_Caps } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

// Body and UI text
const exo = Exo({
  subsets: ["latin"],
  variable: "--font-exo",
});

// Headings, workspace names, stats
const macondo = Macondo({
  subsets: ["latin"],
  variable: "--font-macondo",
  weight: "400",
});

// Brand wordmark only
const macondoSwash = Macondo_Swash_Caps({
  subsets: ["latin"],
  variable: "--font-macondo-swash",
  weight: "400",
});

export const metadata = {
  title: "Doc-Vision-1",
  description: "Protocols, documentation and proofchecking for clinics.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${exo.variable} ${macondo.variable} ${macondoSwash.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}