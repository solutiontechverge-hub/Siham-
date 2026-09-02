import { baseApi } from "./baseApi";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type FavoritesData = {
  businessSetupIds: string[];
};

export const favoritesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFavorites: builder.query<ApiEnvelope<FavoritesData>, void>({
      query: () => "/api/user/favorites",
      providesTags: ["Favorites"],
    }),
    putFavorites: builder.mutation<ApiEnvelope<FavoritesData>, string[]>({
      query: (businessSetupIds) => ({
        url: "/api/user/favorites",
        method: "PUT",
        body: { businessSetupIds },
      }),
      invalidatesTags: ["Favorites"],
    }),
    toggleFavorite: builder.mutation<
      ApiEnvelope<{
        businessSetupId: string;
        favorited: boolean;
        businessSetupIds: string[];
      }>,
      string
    >({
      query: (businessSetupId) => ({
        url: `/api/user/favorites/${businessSetupId}/toggle`,
        method: "POST",
      }),
      invalidatesTags: ["Favorites"],
    }),
  }),
});

export const {
  useGetFavoritesQuery,
  usePutFavoritesMutation,
  useToggleFavoriteMutation,
} = favoritesApi;
