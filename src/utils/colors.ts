/**
 * Get project color from project data or fallback to default
 * @param project - Project object with optional color field
 * @returns Object with hex and tailwind color values
 */
export function getProjectColor(project: { id: string; color?: string | null }): { hex: string; tailwind: string } {
  // Use project's assigned color if available
  if (project.color) {
    return {
      hex: project.color,
      tailwind: `bg-[${project.color}] border-[${project.color}] hover:bg-[${project.color}]/80`
    };
  }
  
  // Fallback to hash-based color assignment
  const colors = [
    { hex: '#3b82f6', tailwind: 'bg-blue-500 border-blue-600 hover:bg-blue-600' },    // blue
    { hex: '#10b981', tailwind: 'bg-green-500 border-green-600 hover:bg-green-600' }, // green
    { hex: '#8b5cf6', tailwind: 'bg-purple-500 border-purple-600 hover:bg-purple-600' }, // purple
    { hex: '#f59e0b', tailwind: 'bg-orange-500 border-orange-600 hover:bg-orange-600' }, // orange
    { hex: '#ec4899', tailwind: 'bg-pink-500 border-pink-600 hover:bg-pink-600' },   // pink
    { hex: '#6366f1', tailwind: 'bg-indigo-500 border-indigo-600 hover:bg-indigo-600' }, // indigo
  ];
  
  const hash = project.id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
}
