export type View = 'overview' | 'evaluate' | 'results'

export type ChoiceValue = 1 | 2 | 3 | 4 | 5 | 6

export type EvaluationPair = {
  id: string
  criterion: string
  prompt: string
  left: { name: string; summary: string; artifactUrl: string }
  right: { name: string; summary: string; artifactUrl: string }
}

export const CHOICES: ReadonlyArray<{ value: ChoiceValue; label: string }> = [
  { value: 1, label: 'ซ้ายดีกว่ามาก' },
  { value: 2, label: 'ซ้ายดีกว่า' },
  { value: 3, label: 'ซ้ายดีกว่าเล็กน้อย' },
  { value: 4, label: 'ขวาดีกว่าเล็กน้อย' },
  { value: 5, label: 'ขวาดีกว่า' },
  { value: 6, label: 'ขวาดีกว่ามาก' },
] as const

export const DEMO_PAIRS: ReadonlyArray<EvaluationPair> = [
  {
    id: 'ux-aurora-borealis',
    criterion: 'User Experience',
    prompt: 'ผลงานใดออกแบบ flow ให้ผู้ใช้ทำภารกิจหลักได้ชัดเจนกว่า?',
    left: { name: 'Aurora', summary: 'Student wellness planner', artifactUrl: 'https://example.edu/showcase/aurora' },
    right: { name: 'Borealis', summary: 'Campus mobility assistant', artifactUrl: 'https://example.edu/showcase/borealis' },
  },
  {
    id: 'ux-catalyst-delta',
    criterion: 'User Experience',
    prompt: 'ผลงานใดสื่อสารสถานะและผลลัพธ์ของการกระทำได้มั่นใจกว่า?',
    left: { name: 'Catalyst', summary: 'Lab equipment tracker', artifactUrl: 'https://example.edu/showcase/catalyst' },
    right: { name: 'Delta', summary: 'Peer tutoring exchange', artifactUrl: 'https://example.edu/showcase/delta' },
  },
  {
    id: 'ux-ember-flux',
    criterion: 'User Experience',
    prompt: 'ผลงานใดให้ประสบการณ์ mobile-first ที่ต่อเนื่องและอ่านง่ายกว่า?',
    left: { name: 'Ember', summary: 'Sustainable dining guide', artifactUrl: 'https://example.edu/showcase/ember' },
    right: { name: 'Flux', summary: 'Creative portfolio coach', artifactUrl: 'https://example.edu/showcase/flux' },
  },
] as const
