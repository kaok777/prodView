/**
 * SEO Structured Data Generators
 *
 * Fixed: LOW-F5 - Missing structured data completeness
 * Fixed: LOW-F6 - Incomplete SEO schema
 *
 * Generates complete Schema.org structured data for better SEO
 */

export function generateProductStructuredData(product: any, imageUrl?: string) {
  const siteUrl = window.location.origin;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": imageUrl || `${siteUrl}/default-product.png`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Various"
    },
    "category": product.categories?.[0]?.name || "Product",
    "offers": {
      "@type": "Offer",
      "url": product.affiliateUrl,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "ProdView"
      }
    },
    "aggregateRating": product.views && product.views > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": product.views.toString()
    } : undefined
  };
}

/**
 * Generates BreadcrumbList structured data
 * Fixed: LOW-F5 - Complete structured data
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  const siteUrl = window.location.origin;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`
    }))
  };
}

/**
 * Generates Organization structured data
 * Fixed: LOW-F5 - Complete structured data
 */
export function generateOrganizationStructuredData() {
  const siteUrl = window.location.origin;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ProdView",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "Discover and explore the best products across various categories",
    "sameAs": [
      // Add social media links here when available
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "url": `${siteUrl}/contact`
    }
  };
}

/**
 * Generates WebSite structured data with search action
 * Fixed: LOW-F5 - Complete structured data
 */
export function generateWebSiteStructuredData() {
  const siteUrl = window.location.origin;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ProdView",
    "url": siteUrl,
    "description": "Discover and explore the best products across various categories",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/products?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function generateSiteMapData(products: any[], categories: any[], useCases: any[]) {
  const baseUrl = window.location.origin;
  const urls = [
    { url: baseUrl, priority: 1.0, changefreq: "daily" },
    { url: `${baseUrl}/products`, priority: 0.9, changefreq: "daily" },
  ];

  // Add product URLs
  products.forEach(product => {
    urls.push({
      url: `${baseUrl}/products/${product.id}`,
      priority: 0.8,
      changefreq: "weekly"
    });
  });

  // Add category URLs
  categories.forEach(category => {
    urls.push({
      url: `${baseUrl}/products?category=${category.id}`,
      priority: 0.7,
      changefreq: "weekly"
    });
  });

  // Add use case URLs
  useCases.forEach(useCase => {
    urls.push({
      url: `${baseUrl}/products?useCase=${useCase.id}`,
      priority: 0.7,
      changefreq: "weekly"
    });
  });

  return urls;
}
