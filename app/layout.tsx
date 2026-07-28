import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "선배 Seonbae — 검증된 튜터를 찾는 가장 확실한 방법",
  description: "서울대·고려대·연세대 재외국민 네트워크에서 직접 검증한 IB, AP, SAT, A-Level, IGCSE 튜터를 만나보세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.theme=localStorage.getItem('seonbae-theme')==='dark'?'dark':'light'}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
