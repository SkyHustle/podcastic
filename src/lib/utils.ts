import DOMPurify from 'isomorphic-dompurify'

export function stripHtmlAndUrls(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/(?:https?|ftp|www\.)\S+/gi, '') // Remove URLs including www
    .replace(
      /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\b/gi,
      '',
    ) // Remove domains
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
}

export function formatDescriptionWithLinks(text: string): string {
  // First strip existing HTML tags but keep the text content
  const strippedHtml = text.replace(/<[^>]*>/g, '')

  // Replace URLs with anchor tags
  const withLinks = strippedHtml.replace(
    /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*\.[a-z]{2,}[^\s]*)/gi,
    (url) => {
      const href = url.startsWith('http') ? url : `https://${url}`
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-pink-500 hover:text-pink-700">${url}</a>`
    },
  )

  // Sanitize the HTML to prevent XSS
  return DOMPurify.sanitize(withLinks)
}
