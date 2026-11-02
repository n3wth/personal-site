export const storyKinds = ['work', 'art', 'thinking', 'projects', 'library', 'contact'] as const
export type StoryKind = (typeof storyKinds)[number]

export function storyKindFromPath(pathname: string): StoryKind | null {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const name = path.slice(1)
  return (storyKinds as readonly string[]).includes(name) ? name as StoryKind : null
}
