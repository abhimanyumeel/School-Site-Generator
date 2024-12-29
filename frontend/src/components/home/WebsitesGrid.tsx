interface Website {
  id: string;
  name: string;
  status: 'active' | 'draft';
  lastUpdated: string;
}

export default function WebsitesGrid() {
  // This will be replaced with actual data fetching later
  const websites: Website[] = [];

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Websites</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
          Create New Website
        </button>
      </div>

      {websites.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 14v20c0 4.4 3.6 8 8 8h16c4.4 0 8-3.6 8-8V14c0-4.4-3.6-8-8-8H16c-4.4 0-8 3.6-8 8zm6 4h20M14 26h20M14 32h12"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No websites yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first website.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Website cards will go here */}
        </div>
      )}
    </div>
  );
}
