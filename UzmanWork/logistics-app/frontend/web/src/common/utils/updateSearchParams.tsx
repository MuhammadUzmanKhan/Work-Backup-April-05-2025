// function to retrieve the previous search params values
export function updateSearchParams(
  params: URLSearchParams,
  updates: Partial<Record<string, string>>
): URLSearchParams {
  const updatedParams = new URLSearchParams(params.toString());
  Object.entries(updates).forEach(([key, value]) => {
    updatedParams.set(key, value ?? "");
  });
  return updatedParams;
}
