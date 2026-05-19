const baseUrl = import.meta.env.BASE_URL;

export const withBase = (path = '/') => {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return path;
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  return new URL(normalizedPath, `https://example.com${normalizedBase}`).pathname;
};

export const absoluteSiteUrl = (path: string, site: URL | undefined) => {
  const baseAwarePath = withBase(path);
  return site ? new URL(baseAwarePath, site).toString() : baseAwarePath;
};

export const siteBase = baseUrl;
