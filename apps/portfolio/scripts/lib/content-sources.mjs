/** Serializer every snapshot file on disk uses: pretty JSON, trailing newline. */
export function canonical(value) {
  return JSON.stringify(value, null, 2) + '\n'
}

export function validateGardenIndex(index) {
  const errors = []
  if (typeof index !== 'object' || index === null || Array.isArray(index)) {
    errors.push('garden-index.json: expected an object')
    return errors
  }
  if (typeof index.noteCount !== 'number') errors.push('garden-index.json.noteCount: expected a number')
  if (typeof index.indexedCount !== 'number') errors.push('garden-index.json.indexedCount: expected a number')
  if (!Array.isArray(index.topics) || index.topics.length === 0) {
    errors.push('garden-index.json.topics: expected a non-empty array')
  } else {
    index.topics.forEach((topic, i) => {
      if (typeof topic?.name !== 'string' || !topic.name) {
        errors.push(`garden-index.json.topics[${i}].name: expected a non-empty string`)
      }
      if (typeof topic?.href !== 'string' || !topic.href) {
        errors.push(`garden-index.json.topics[${i}].href: expected a non-empty string`)
      }
      if (typeof topic?.count !== 'number') {
        errors.push(`garden-index.json.topics[${i}].count: expected a number`)
      }
    })
  }
  return errors
}

export function validateGardenSearch(search) {
  const errors = []
  if (typeof search !== 'object' || search === null || Array.isArray(search)) {
    errors.push('garden-search.json: expected an object')
    return errors
  }
  if (!Array.isArray(search.notes) || search.notes.length === 0) {
    errors.push('garden-search.json.notes: expected a non-empty array')
    return errors
  }
  search.notes.forEach((note, i) => {
    if (typeof note?.title !== 'string' || !note.title) {
      errors.push(`garden-search.json.notes[${i}].title: expected a non-empty string`)
    }
    if (typeof note?.href !== 'string' || !note.href) {
      errors.push(`garden-search.json.notes[${i}].href: expected a non-empty string`)
    }
    if (note?.tags !== undefined && (!Array.isArray(note.tags) || note.tags.some((tag) => typeof tag !== 'string' || !tag))) {
      errors.push(`garden-search.json.notes[${i}].tags: expected an array of non-empty strings`)
    }
  })
  return errors
}

// ---------------------------------------------------------------------------
// ui-meta.json <- https://registry.npmjs.org/@n3wth%2Fui/latest
// ---------------------------------------------------------------------------

export function parseUiRegistry(text) {
  const data = JSON.parse(text)
  return { version: typeof data.version === 'string' ? data.version : '', install: 'npm install @n3wth/ui' }
}

export function validateUiMeta(meta) {
  const errors = []
  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    errors.push('ui-meta.json: expected an object')
    return errors
  }
  if (typeof meta.version !== 'string' || !/^\d+\.\d+\.\d+/.test(meta.version)) {
    errors.push('ui-meta.json.version: expected a non-empty semver-like string')
  }
  if (typeof meta.install !== 'string' || !meta.install) {
    errors.push('ui-meta.json.install: expected a non-empty string')
  }
  return errors
}

// Remote snapshots refreshed explicitly; local note snapshots are built offline.
export const SOURCES = [
  {
    name: 'ui-meta',
    urls: ['https://registry.npmjs.org/@n3wth%2Fui/latest'],
    files: ['ui-meta.json'],
    parse: ([registryJson]) => ({ 'ui-meta.json': parseUiRegistry(registryJson) }),
    validate: (value) => validateUiMeta(value['ui-meta.json']),
  },
]

export const SNAPSHOTS = [
  ...SOURCES,
  {
    name: 'garden-index',
    files: ['garden-index.json', 'garden-search.json'],
    validate: (value) => [
      ...validateGardenIndex(value['garden-index.json']),
      ...validateGardenSearch(value['garden-search.json']),
    ],
  },
]
