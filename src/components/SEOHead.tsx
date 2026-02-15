import { Helmet } from "react-helmet-async";

/**
 * SEOHead Component
 *
 * Fixed: MEDIUM-F5 - SEOHead DOM Manipulation Inefficiency
 * Fixed: LOW-F5 - Missing structured data completeness
 * Fixed: LOW-F6 - Incomplete SEO schema
 *
 * Now uses react-helmet-async for efficient meta tag management
 * Includes complete OpenGraph and structured data support
 */

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  structuredData?: object | object[];
  image?: string;
  type?: "website" | "article" | "product";
  publishedTime?: string;
  modifiedTime?: string;
}

export function SEOHead({
  title,
  description,
  canonicalUrl,
  structuredData,
  image,
  type = "website",
  publishedTime,
  modifiedTime
}: SEOHeadProps) {
  const fullTitle = title.includes("ProdView") ? title : `${title} | ProdView`;
  const siteUrl = window.location.origin;
  const currentUrl = canonicalUrl || window.location.href;
  const defaultImage = `${siteUrl}/og-image.png`;
  const ogImage = image || defaultImage;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook - Fixed: LOW-F6 */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="ProdView" />
      <meta property="og:locale" content="en_US" />

      {/* Article metadata for blog/article pages */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data - Fixed: LOW-F5 */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(structuredData) ? structuredData : [structuredData])}
        </script>
      )}
    </Helmet>
  );
}
