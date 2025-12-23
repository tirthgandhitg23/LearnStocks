import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import React from "react";

export interface ResourceItem {
  label: string;
  href: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

interface ResourceSectionProps {
  title: string;
  items: ResourceItem[];
}

export const ResourceSection: React.FC<ResourceSectionProps> = ({ title, items }) => {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="sr-only">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.label}>
                <a
                  href={it.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    {it.Icon ? <it.Icon className="h-5 w-5 text-learngreen-600" /> : null}
                    <span className="text-base font-medium">{it.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceSection;
