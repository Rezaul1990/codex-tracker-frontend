const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

type ApiResponse<T> = {
  code?: string;
  data?: T;
  message?: string;
};

const rawRequest = async <T>(path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(result.message || "Request failed");
  }

  return result;
};

export const apiRequest = async <T>(path: string, options: RequestInit = {}) => {
  try {
    return await rawRequest<T>(path, options);
  } catch (error) {
    const canRefresh =
      path !== "/api/auth/refresh" &&
      path !== "/api/auth/login" &&
      error instanceof Error &&
      /Authentication required|Invalid or expired access token/i.test(error.message);

    if (!canRefresh) {
      throw error;
    }

    await rawRequest("/api/auth/refresh", {
      method: "POST",
    });

    return rawRequest<T>(path, options);
  }
};
