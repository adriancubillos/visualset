import React from 'react';
import { GanttProject } from './GanttChart';

interface GanttHierarchyProps {
  projects: GanttProject[];
  expandedProjects: Set<string>;
  expandedItems: Set<string>;
  onToggleProject: (projectId: string) => void;
  onToggleItem: (itemId: string) => void;
}

export default function GanttHierarchy({
  projects,
  expandedProjects,
  expandedItems,
  onToggleProject,
  onToggleItem,
}: GanttHierarchyProps) {
  return (
    <div className="w-80 border-r border-gray-200 bg-gray-50">
      {/* This component can be used for a separate hierarchy panel if needed */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-700 mb-4">Project Hierarchy</h3>

        {projects.map((project) => (
          <div
            key={project.id}
            className="mb-2">
            <button
              onClick={() => onToggleProject(project.id)}
              className="flex items-center w-full text-left p-2 rounded hover:bg-gray-100">
              <svg
                className={`w-4 h-4 mr-2 transition-transform ${
                  expandedProjects.has(project.id) ? 'transform rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <div
                className="w-3 h-3 rounded mr-2"
                style={{ backgroundColor: project.color || '#6B7280' }}
              />
              <span className="text-sm font-medium">{project.name}</span>
            </button>

            {expandedProjects.has(project.id) && (
              <div className="ml-6">
                {project.items.map((item) => (
                  <div
                    key={item.id}
                    className="mb-1">
                    <button
                      onClick={() => onToggleItem(item.id)}
                      className="flex items-center w-full text-left p-1 rounded hover:bg-gray-100">
                      <svg
                        className={`w-3 h-3 mr-2 transition-transform ${
                          expandedItems.has(item.id) ? 'transform rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span className="text-xs">{item.name}</span>
                    </button>

                    {expandedItems.has(item.id) && (
                      <div className="ml-4">
                        {item.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="py-1">
                            <span className="text-xs text-gray-600">{task.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
