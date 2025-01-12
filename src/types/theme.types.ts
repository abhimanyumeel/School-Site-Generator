export interface ThemeMetadata {
  theme: string;
  displayName: string;
  pages: {
    [key: string]: {
      title: string;
      sections: {
        [key: string]: {
          title: string;
          fields: {
            [key: string]: {
              type: string;
              label: string;
              required?: boolean;
              default?: string;
            }
          }
        };
      };
    };
  };
  config: any;
  fieldTypes: any;
}

export interface Theme {
  id: string;
  name: string;
  previewPath: string;
  metadata: ThemeMetadata;
} 