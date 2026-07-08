import { baseApi } from "./baseApi";

export type ContactMessagePayload = {
  persona: string;
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactMessageResponse = {
  id: string;
  created_at: string;
};

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitContactMessage: builder.mutation<
      { success: boolean; message: string; data: ContactMessageResponse },
      ContactMessagePayload
    >({
      query: (body) => ({
        url: "/api/contact",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useSubmitContactMessageMutation } = contactApi;
