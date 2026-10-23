// fetch resolves on any status, and every caller here wants only a successful answer
export const fetchJson = async (url, { query, ...options } = {}) => {
  const response = await fetch(query ? `${url}?${new URLSearchParams(query)}` : url, options);
  if (!response.ok) throw new Error(`${new URL(url).host} answered ${response.status}`);
  return response.json();
};
