interface BreadcrumbProps {
  items: Array<{
    label: string;
    href: string;
  }>;
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <span className="text-gray-700 text-sm font-medium">Home</span>
        </li>
      </ol>
    </nav>
  );
} 