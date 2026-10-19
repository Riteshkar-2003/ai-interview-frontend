import "./globals.css";
import GlobalQueryWidget from "./components/GlobalQueryWidget";

export const metadata = {
  title: "AI Interview Preparation Platform",
  description: "AI-powered interview preparation platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <GlobalQueryWidget />
      </body>
    </html>
  );
}