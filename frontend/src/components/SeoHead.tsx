import { useEffect } from 'react'

const SITE_NAME = 'AgendaPro'
const DEFAULT_DESCRIPTION =
  'Agende serviços online com horários reais disponíveis. Confirmação imediata e área administrativa para gestão da agenda.'
const DEFAULT_OG_IMAGE = '/favicon.svg'

type SeoHeadProps = {
  title: string
  description?: string
  path?: string
  noIndex?: boolean
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

/**
 * SEO para SPA sem dependência extra (React 19 não casa bem com react-helmet-async).
 * Atualizo title + meta/OG no document — crawlers básicos e compartilhamento social.
 */
export function SeoHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noIndex = false,
}: SeoHeadProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`
    document.title = fullTitle

    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:image', DEFAULT_OG_IMAGE)

    upsertMeta('name', 'twitter:card', 'summary')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', description)

    const canonicalHref = path.startsWith('http')
      ? path
      : `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', canonicalHref)
  }, [title, description, path, noIndex])

  return null
}
