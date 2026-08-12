export const won = (n: number): string => '₩' + n.toLocaleString('en-US');

export const formatDate = (d: Date): string =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Scene picker so each subject media panel looks a little different.
export const subjectScene = (order: number): 'call' | 'desk' | 'figure' | 'rings' | 'notes' => {
  const scenes = ['desk', 'notes', 'rings', 'figure', 'call', 'notes'] as const;
  return scenes[(order - 1) % scenes.length];
};
