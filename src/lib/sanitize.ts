import createDOMPurify from 'dompurify'

const RICH_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li',
  'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
  'code', 'pre', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span', 'div', 'hr',
]

const RICH_ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id', 'style',
  'target', 'rel', 'width', 'height', 'align', 'loading',
]

const BASIC_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li',
  'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]

const BASIC_ALLOWED_ATTR = ['href', 'target', 'rel']

const SELF_CLOSING_TAGS = new Set(['br', 'hr', 'img'])
const URL_ATTRS = new Set(['href', 'src'])
const TEXT_ATTRS = new Set(['alt', 'title'])
const ALLOWED_TARGETS = new Set(['_blank', '_self', '_parent', '_top'])
const ALLOWED_LOADING_VALUES = new Set(['lazy', 'eager'])
const ALLOWED_ALIGN_VALUES = new Set(['left', 'right', 'center', 'justify'])
const HTML_TOKEN_REGEX = /<\/?[^>]*>|[^<]+|</g
const HTML_TAG_REGEX = /^<\s*(\/?)\s*([a-z0-9-]+)([^>]*)\s*(\/?)\s*>$/i
const HTML_ATTR_REGEX = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

type SanitizeOptions = {
  ALLOWED_TAGS: string[]
  ALLOWED_ATTR: string[]
  KEEP_CONTENT?: boolean
}

let browserPurifier: ReturnType<typeof createDOMPurify> | null = null

function getPurifier() {
  if (typeof window === 'undefined') {
    return null
  }

  browserPurifier ??= createDOMPurify(window)

  return typeof browserPurifier.sanitize === 'function' ? browserPurifier : null
}

function sanitizeWithRuntime(html: string, options: SanitizeOptions): string {
  const purifier = getPurifier()

  if (purifier) {
    return purifier.sanitize(html, options)
  }

  return sanitizeHtmlOnServer(html, options)
}

function sanitizeHtmlOnServer(html: string, options: SanitizeOptions): string {
  if (!html) {
    return ''
  }

  const allowedTags = new Set(options.ALLOWED_TAGS.map((tag) => tag.toLowerCase()))
  const allowedAttrs = new Set(options.ALLOWED_ATTR.map((attr) => attr.toLowerCase()))
  const tokens = html.match(HTML_TOKEN_REGEX) ?? []

  return tokens
    .map((token) => sanitizeToken(token, allowedTags, allowedAttrs))
    .join('')
}

function sanitizeToken(token: string, allowedTags: Set<string>, allowedAttrs: Set<string>): string {
  if (token === '<') {
    return '&lt;'
  }

  if (!token.startsWith('<')) {
    return token
  }

  const match = token.match(HTML_TAG_REGEX)
  if (!match) {
    return escapeHtml(token)
  }

  const [, isClosingTag, rawTagName, rawAttributes, selfClosingMarker] = match
  const tagName = rawTagName.toLowerCase()

  if (!allowedTags.has(tagName)) {
    return ''
  }

  if (isClosingTag) {
    return SELF_CLOSING_TAGS.has(tagName) ? '' : `</${tagName}>`
  }

  const serializedAttrs = serializeAttributes(rawAttributes, tagName, allowedAttrs)
  const isSelfClosing = selfClosingMarker === '/' || SELF_CLOSING_TAGS.has(tagName)

  if (isSelfClosing) {
    return `<${tagName}${serializedAttrs}>`
  }

  return `<${tagName}${serializedAttrs}>`
}

function serializeAttributes(rawAttributes: string, tagName: string, allowedAttrs: Set<string>): string {
  const serialized: string[] = []
  let match: RegExpExecArray | null
  let hasTargetBlank = false
  HTML_ATTR_REGEX.lastIndex = 0

  while ((match = HTML_ATTR_REGEX.exec(rawAttributes)) !== null) {
    const attrName = match[1].toLowerCase()
    const rawValue = match[2] ?? match[3] ?? match[4] ?? ''

    if (!allowedAttrs.has(attrName)) {
      continue
    }

    const sanitizedValue = sanitizeAttributeValue(attrName, rawValue)
    if (sanitizedValue === null) {
      continue
    }

    if (attrName === 'target' && sanitizedValue === '_blank') {
      hasTargetBlank = true
    }

    serialized.push(` ${attrName}="${escapeAttribute(sanitizedValue)}"`)
  }

  if (tagName === 'a' && hasTargetBlank && !serialized.some((attr) => attr.startsWith(' rel='))) {
    serialized.push(' rel="noopener noreferrer"')
  }

  return serialized.join('')
}

function sanitizeAttributeValue(attrName: string, rawValue: string): string | null {
  const value = rawValue.trim()

  if (URL_ATTRS.has(attrName)) {
    return sanitizeUrl(value)
  }

  if (TEXT_ATTRS.has(attrName)) {
    return value
  }

  if (attrName === 'target') {
    return ALLOWED_TARGETS.has(value) ? value : null
  }

  if (attrName === 'rel') {
    return value.replace(/[^a-zA-Z0-9\s-]/g, ' ').trim() || null
  }

  if (attrName === 'class') {
    return /^[a-zA-Z0-9_\-\s:]+$/.test(value) ? value : null
  }

  if (attrName === 'id') {
    return /^[a-zA-Z][a-zA-Z0-9\-_:.]*$/.test(value) ? value : null
  }

  if (attrName === 'style') {
    return sanitizeInlineStyle(value)
  }

  if (attrName === 'width' || attrName === 'height') {
    return /^\d{1,4}$/.test(value) ? value : null
  }

  if (attrName === 'align') {
    return ALLOWED_ALIGN_VALUES.has(value.toLowerCase()) ? value.toLowerCase() : null
  }

  if (attrName === 'loading') {
    return ALLOWED_LOADING_VALUES.has(value.toLowerCase()) ? value.toLowerCase() : null
  }

  return value || null
}

function sanitizeUrl(value: string): string | null {
  if (!value) {
    return null
  }

  if (/^(https?:|mailto:|tel:|\/(?!\/)|#)/i.test(value)) {
    return value
  }

  return null
}

function sanitizeInlineStyle(value: string): string | null {
  if (!value) {
    return null
  }

  if (/url\s*\(|expression\s*\(|javascript:/i.test(value)) {
    return null
  }

  return /^[#%(),.\-:;\s_a-zA-Z0-9]+$/.test(value) ? value : null
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Sanitize HTML content to prevent XSS attacks.
 */
export function sanitizeHtml(html: string): string {
  return sanitizeWithRuntime(html, {
    ALLOWED_TAGS: RICH_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_ALLOWED_ATTR,
    KEEP_CONTENT: true,
  })
}

/**
 * Sanitize HTML but allow only basic formatting.
 */
export function sanitizeBasicHtml(html: string): string {
  return sanitizeWithRuntime(html, {
    ALLOWED_TAGS: BASIC_ALLOWED_TAGS,
    ALLOWED_ATTR: BASIC_ALLOWED_ATTR,
    KEEP_CONTENT: true,
  })
}

/**
 * Strip all HTML tags, returning plain text only.
 */
export function stripHtml(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }

  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
