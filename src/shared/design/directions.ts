/** РСО directions and their palettes (brandbook 2026 v2.1). A direction's colors are only for its own content. */
export type DirectionId =
  | 'agro'
  | 'pedagogical'
  | 'production'
  | 'construction'
  | 'service'
  | 'medical'
  | 'teen'
  | 'conductors'
  | 'fishing';

export interface Direction {
  id: DirectionId;
  name: string;
  /** Brandbook order: main, light (backgrounds), alt (third shade). */
  color: { main: string; light: string; alt: string };
}

export const DIRECTIONS: readonly Direction[] = [
  {
    id: 'agro',
    name: 'Студенческие сельскохозяйственные отряды',
    color: { main: '#FE9633', light: '#FFDEBF', alt: '#FB7A00' },
  },
  {
    id: 'pedagogical',
    name: 'Студенческие педагогические отряды',
    color: { main: '#4CACF7', light: '#D4ECFF', alt: '#008FFF' },
  },
  {
    id: 'production',
    name: 'Студенческие производственные отряды',
    color: { main: '#FF794C', light: '#FFDFD4', alt: '#FF4C0F' },
  },
  {
    id: 'construction',
    name: 'Студенческие строительные отряды',
    color: { main: '#0453FF', light: '#E1E0FF', alt: '#0040CB' },
  },
  {
    id: 'service',
    name: 'Студенческие сервисные отряды',
    color: { main: '#6DC185', light: '#DCFFE6', alt: '#469E5F' },
  },
  {
    id: 'medical',
    name: 'Студенческие медицинские отряды',
    color: { main: '#00DFF2', light: '#D9FCFF', alt: '#00C5D6' },
  },
  {
    id: 'teen',
    name: 'Трудовые отряды подростков',
    color: { main: '#8043F9', light: '#E8DDFF', alt: '#6601E9' },
  },
  {
    id: 'conductors',
    name: 'Студенческие отряды проводников',
    color: { main: '#FE4734', light: '#FFE5E3', alt: '#E61F25' },
  },
  {
    id: 'fishing',
    name: 'Студенческие путинные отряды',
    color: { main: '#2E727F', light: '#BEDBE5', alt: '#8CB9C7' },
  },
];
