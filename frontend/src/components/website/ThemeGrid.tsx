import Image from 'next/image';

interface Theme {
  id: string;
  name: string;
  previewPath: string;
}

interface ThemeGridProps {
  themes: Theme[];
  onSelect: (themeId: string) => void;
}

export default function ThemeGrid({ themes, onSelect }: ThemeGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {themes.map((theme) => (
        <div
          key={theme.id}
          className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          onClick={() => onSelect(theme.id)}
        >
          <div className="aspect-w-16 aspect-h-9 rounded-t-lg overflow-hidden">
            <Image
              src={theme.previewPath}
              alt={`${theme.name} preview`}
              width={640}
              height={360}
              className="object-cover group-hover:opacity-75 transition-opacity duration-200"
            />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">
              {theme.name}
            </h3>
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => onSelect(theme.id)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Select Theme
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/themes/${theme.id}/preview`, '_blank');
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Preview
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
