export function generateProductStructuredData(product: any, imageUrl?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": imageUrl,
    "category": "Product",
    "offers": {
      "@type": "Offer",
      "url": product.affiliateUrl,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "ProdView"
      }
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
