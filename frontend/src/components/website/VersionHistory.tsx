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
    <div>
      <h2 className="text-xl text-center font-semibold mb-8 text-gray-800">
        Version History
      </h2>
      <div className="relative flex flex-col items-center">
        {/* Timeline line - centered */}
        <div className="absolute inset-0 w-1 bg-indigo-400 mx-auto" />

        <div className="space-y-6 w-full">
          {versions.map((version, index) => (
            <div key={version.id} className="relative">
              {/* Timeline dot - centered */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 top-4 z-10 w-4 h-4 rounded-full border-2
                  ${version.isActive 
                    ? 'bg-green-200 border-green-500' 
                    : 'bg-white border-indigo-400'}`}
              />

              {/* Card with arrow pointing to timeline */}
              <div 
                className={`
                  relative mx-6 p-4 rounded-xl transition-all duration-300 ease-in-out cursor-pointer
                  ${version.isActive 
                    ? 'bg-gradient-to-br from-green-100 to-white shadow-md border border-green-200' 
                    : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-200'}
                  before:content-[''] before:absolute before:left-1/2 before:top-4 
                  before:-translate-x-1/2 before:w-4 before:h-4 before:rotate-45
                  ${version.isActive
                    ? 'before:border-t before:border-l before:border-green-200 before:bg-green-50'
                    : 'before:border-t before:border-l before:border-gray-200 before:bg-white hover:before:border-indigo-200'}
                `}
                onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
              >
                <div className="space-y-2 pt-6">
                  <div className="flex justify-between items-center">
                    {version.isActive ? (
                      <h3 className="font-medium text-sm border-green-700 rounded-lg px-3 py-1 bg-green-200 text-gray-900"> Version {version.versionNumber} </h3>
                    ) : (
                      <h3 className="font-medium border rounded-lg px-3 py-1 text-sm bg-gray-100 text-gray-900">
                        Version {version.versionNumber}
                      </h3>
                    )}
                    {version.isActive ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-700">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onActivate(version.id);
                        }}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                 bg-gray-100 text-indigo-600 hover:bg-indigo-100 transition-colors duration-200"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    {new Date(version.createdAt).toLocaleString()}
                  </p>
                  
                  {version.changeDescription && (
                    <p className="text-sm text-gray-600">
                      {version.changeDescription}
                    </p>
                  )}

                  {/* Show changes when expanded - smooth animation */}
                  <div 
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${expandedVersion === version.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="mt-3 p-4 border rounded-lg bg-gray-50 border-gray-300">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Changes made:</h4>
                      <ul className="text-sm text-gray-600 space-y-1.5">
                        {compareVersions(version.data).map((change, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
