import DOMPurify from 'isomorphic-dompurify'

// Configure DOMPurify to only allow basic formatting tags
export const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}
