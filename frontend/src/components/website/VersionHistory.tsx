interface Version {
  id: string;
  versionNumber: number;
  createdAt: string;
  changeDescription: string;
  isActive: boolean;
}

interface VersionHistoryProps {
  versions: Version[];
  onActivate: (id: string) => void;
}

export default function VersionHistory({ versions, onActivate }: VersionHistoryProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
        Version History
      </h2>
      <div className="space-y-4">
        {versions.map((version) => (
          <div 
            key={version.id} 
            className={`
              relative p-4 rounded-xl transition-all duration-200
              ${version.isActive 
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100' 
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'}
            `}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">
                  Version {version.versionNumber}
                </h3>
                {version.isActive ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => onActivate(version.id)}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                             bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                  >
                    Activate
                  </button>
                )}
              </div>
              
              <p className="text-sm text-gray-500">
                {new Date(version.createdAt).toLocaleString()}
              </p>
              
              {version.changeDescription && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {version.changeDescription}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
