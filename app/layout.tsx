import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StarKids",
  description: "Help kids earn stars through chores, gigs, and responsibilities",
  manifest: "/manifest.json",
  applicationName: "StarKids",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StarKids",
    startupImage: [
      // iPhone 15 Pro Max, 14 Pro Max
      {
        url: "/splash-1290x2796.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 15 Pro, 14 Pro
      {
        url: "/splash-1179x2556.png",
        media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 15, 15 Plus, 14, 13, 13 Pro, 12, 12 Pro
      {
        url: "/splash-1170x2532.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 Plus, 13 Pro Max, 12 Pro Max
      {
        url: "/splash-1284x2778.png",
        media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 13 mini, 12 mini
      {
        url: "/splash-1080x2340.png",
        media: "(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 11 Pro Max, XS Max
      {
        url: "/splash-1242x2688.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 11, XR
      {
        url: "/splash-828x1792.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPhone 11 Pro, X, XS
      {
        url: "/splash-1125x2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 8 Plus
      {
        url: "/splash-1242x2208.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 8, SE
      {
        url: "/splash-750x1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad Pro 12.9"
      {
        url: "/splash-2048x2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad Pro 11"
      {
        url: "/splash-1668x2388.png",
        media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad Air, iPad 10.2"
      {
        url: "/splash-1620x2160.png",
        media: "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2)",
      },
      // iPad Mini
      {
        url: "/splash-1536x2048.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#9333ea",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-white antialiased touch-manipulation">
        {children}
      </body>
    </html>
  );
}
