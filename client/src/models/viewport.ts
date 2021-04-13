interface ViewportInterface {
  name: 'Desktop' | 'Tablet' | 'Mobile';
  x: number;
  y: number;
  on: boolean;
  id: number;
}

export type Viewport = Readonly<ViewportInterface>;
