import ky, { HTTPError } from "ky";

export const apiBase = import.meta.env.VITE_API_URL;

export type ApiErrorResponse = { message: string };

type WrappedApiErrorResponse = { data: ApiErrorResponse };

type KnownApiErrorResponse = ApiErrorResponse | WrappedApiErrorResponse;

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => (
  typeof value === "object" &&
  value !== null &&
  "message" in value &&
  typeof value.message === "string"
);

const isWrappedApiErrorResponse = (value: unknown): value is WrappedApiErrorResponse => (
  typeof value === "object" &&
  value !== null &&
  "data" in value &&
  isApiErrorResponse(value.data)
);

const getApiErrorMessageFromBody = (value: unknown): string | undefined => {
  if (isApiErrorResponse(value)) {
    return value.message;
  }

  if (isWrappedApiErrorResponse(value)) {
    return value.data.message;
  }

  return undefined;
};

export const getApiErrorMessage = async (error: unknown): Promise<string> => {
  if (error instanceof HTTPError) {
    const message = getApiErrorMessageFromBody(
      (error as HTTPError<KnownApiErrorResponse>).data,
    );

    if (message) return message;
  }

  return error instanceof Error ? error.message : "Unexpected error";
};

export const api = ky.create({
  prefix: apiBase,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  retry: 2,
  hooks: {
    beforeError: [
      async ({ error }) => {
        error.message = await getApiErrorMessage(error);

        return error;
      },
    ],
  },
});
