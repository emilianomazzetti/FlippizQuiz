export const getGlobalKey = (name: string) => name.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
