interface ViewportInterface {
  w: number;
  h: number;
  mobile: boolean;
  id: number;
}

export type Viewport = Readonly<ViewportInterface>;
