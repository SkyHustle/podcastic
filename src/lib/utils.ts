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
