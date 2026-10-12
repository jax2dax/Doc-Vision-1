import { Exo, Macondo, Macondo_Swash_Caps } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

// Body and UI text
const GTM_ID = "GTM-W2Q6DRDB";

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
  description: "Due dates and document questions for group homes.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${exo.variable} ${macondo.variable} ${macondoSwash.variable}`}
    >
      <head>
        <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}</Script>
      </head>
      <body className="antialiased">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
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