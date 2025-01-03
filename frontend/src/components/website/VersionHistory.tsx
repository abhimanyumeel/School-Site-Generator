import { useState } from 'react';

interface Version {
  id: string;
  versionNumber: number;
  createdAt: string;
  changeDescription: string;
  isActive: boolean;
  data: Record<string, any>;
}

interface VersionHistoryProps {
  versions: Version[];
  onActivate: (id: string) => void;
  currentData: Record<string, any>;
}

export default function VersionHistory({ versions, onActivate, currentData }: VersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  const compareVersions = (versionData: Record<string, any>) => {
    const changes: string[] = [];
    
    // Recursively compare objects
    const compareObjects = (oldObj: any, newObj: any, path: string = '') => {
      if (!oldObj || !newObj) return;
      
      Object.keys(newObj).forEach(key => {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (typeof newObj[key] === 'object' && newObj[key] !== null) {
          compareObjects(oldObj[key], newObj[key], fullPath);
        } else if (oldObj[key] !== newObj[key]) {
          changes.push(`Changed ${fullPath}`);
        }
      });
    };

    compareObjects(currentData, versionData);
    return changes;
  };

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
              relative p-4 rounded-xl transition-all duration-200 cursor-pointer
              ${version.isActive 
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100' 
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'}
            `}
            onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onActivate(version.id);
                    }}
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
                <p className="text-sm text-gray-600 mt-2">
                  {version.changeDescription}
                </p>
              )}

              {/* Show changes when expanded */}
              {expandedVersion === version.id && version.data && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Changes made:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {compareVersions(version.data).map((change, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
