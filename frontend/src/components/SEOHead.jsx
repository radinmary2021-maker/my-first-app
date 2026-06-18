const SITE_NAME = 'نوبتیک'
const BASE_URL  = 'https://nobatiic.ir'

export default function SEOHead({ title, description, canonical, ogType = 'website', ogImage, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — رزرو آنلاین نوبت برای هر کسب‌وکاری`
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : null

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </>
  )
}
