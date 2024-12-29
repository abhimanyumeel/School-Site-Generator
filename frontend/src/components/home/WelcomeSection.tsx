export default function WelcomeSection() {
  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Welcome to Website Builder
      </h2>
      <p className="text-gray-600 mb-6">
        Create and manage beautiful websites for your school with our easy-to-use builder.
        Choose from our professionally designed templates and customize them to match your needs.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Choose Template</h3>
          <p className="text-blue-700 text-sm">Select from our collection of school-specific templates</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">Customize Content</h3>
          <p className="text-green-700 text-sm">Add your content and customize the design</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-medium text-purple-900 mb-2">Publish Website</h3>
          <p className="text-purple-700 text-sm">Preview and publish your website instantly</p>
        </div>
      </div>
    </div>
  );
}
