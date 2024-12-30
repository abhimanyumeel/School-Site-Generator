export interface ThemeMetadata {
  theme: string;
  displayName: string;
  pages: {
    [key: string]: {
      title: string;
      sections: {
        [key: string]: {
          title: string;
          fields: Record<string, any>;
        };
      };
    };
  };
}

export interface Theme {
  id: string;
  name: string;
  previewPath: string;
  metadata: ThemeMetadata;
} 