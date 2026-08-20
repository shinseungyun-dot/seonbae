import type { MetadataRoute } from "next";

const siteUrl = "https://www.seonbaetutor.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/portal/", "/login", "/signup", "/reset-password", "/my-page"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
