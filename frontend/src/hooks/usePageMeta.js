import { useEffect } from 'react';
import { APP_NAME, APP_URL } from '../config/env';

const SITE_NAME = APP_NAME;
const DEFAULT_DESCRIPTION = 'Discover thoughtfully selected products at Luxe Store.';

const setMeta = (selector, attributes, content) => {
  let element = document.head.querySelector(selector);
  if (!content) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.append(element);
  }
  element.setAttribute('content', content);
};

const getCanonicalUrl = (path) => {
  return `${APP_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const usePageMeta = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = window.location.pathname,
  image,
  type = 'website',
  noIndex = false,
  jsonLd,
  skip = false
} = {}) => {
  useEffect(() => {
    if (skip) return;

    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const canonicalUrl = getCanonicalUrl(path);
    document.title = pageTitle;

    setMeta('meta[name="description"]', { name: 'description' }, description);
    setMeta('meta[name="robots"]', { name: 'robots' }, noIndex ? 'noindex,nofollow' : 'index,follow');
    setMeta('meta[property="og:title"]', { property: 'og:title' }, pageTitle);
    setMeta('meta[property="og:description"]', { property: 'og:description' }, description);
    setMeta('meta[property="og:type"]', { property: 'og:type' }, type);
    setMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    setMeta('meta[property="og:image"]', { property: 'og:image' }, image);
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, pageTitle);
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, image);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.append(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    const structuredDataId = 'page-structured-data';
    document.getElementById(structuredDataId)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = structuredDataId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
      document.head.append(script);
    }
  }, [description, image, jsonLd, noIndex, path, skip, title, type]);
};
