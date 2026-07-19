import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || '';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api`,
    prepareHeaders: (headers) => {
      const t = localStorage.getItem('token');
      if (t) headers.set('authorization', `Bearer ${t}`);
      return headers;
    },
  }),
  tagTypes: ['User', 'Events', 'News', 'Family', 'Notifications', 'Invitations', 'AdminUsers', 'Village'],
  endpoints: (builder) => ({
    getMapConfig: builder.query({
      query: () => '/public/map-config',
    }),
    getCountries: builder.query({
      query: () => '/public/location/countries',
    }),
    getStates: builder.query({
      query: (countryCode) => `/public/location/states/${countryCode}`,
    }),
    getDistricts: builder.query({
      query: ({ countryCode, state, stateCode }) => {
        const p = new URLSearchParams({ countryCode, state });
        if (stateCode) p.set('stateCode', stateCode);
        return `/public/location/districts?${p}`;
      },
    }),
    getSubDistricts: builder.query({
      query: (districtCode) => `/public/location/subdistricts?districtCode=${encodeURIComponent(districtCode)}`,
    }),
    getLocationVillages: builder.query({
      query: ({ country, state, district, districtCode, subDistrictCode, q }) => {
        const p = new URLSearchParams({ country, state, district });
        if (districtCode) p.set('districtCode', districtCode);
        if (subDistrictCode) p.set('subDistrictCode', subDistrictCode);
        if (q) p.set('q', q);
        return `/public/location/villages?${p}`;
      },
    }),
    searchPlaces: builder.query({
      query: (q) => `/public/location/search?q=${encodeURIComponent(q)}`,
    }),
    getMyVillage: builder.query({
      query: () => '/villages/me',
      providesTags: ['Village'],
    }),
    joinVillage: builder.mutation({
      query: (body) => ({ url: '/villages/join', method: 'POST', body }),
      invalidatesTags: ['User', 'Village', 'Events', 'News', 'Invitations'],
    }),
    createCustomVillage: builder.mutation({
      query: (body) => ({ url: '/villages/custom', method: 'POST', body }),
      invalidatesTags: ['Village'],
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    verifyOtp: builder.mutation({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
    }),
    resendOtp: builder.mutation({
      query: (body) => ({ url: '/auth/resend-otp', method: 'POST', body }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateMe: builder.mutation({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    registerFcm: builder.mutation({
      query: (body) => ({ url: '/auth/fcm-token', method: 'POST', body }),
    }),
    getFamily: builder.query({
      query: () => '/family',
      providesTags: ['Family'],
    }),
    addFamilyMember: builder.mutation({
      query: (body) => ({ url: '/family/members', method: 'POST', body }),
      invalidatesTags: ['Family'],
    }),
    setFamilyHead: builder.mutation({
      query: (body) => ({ url: '/family/head', method: 'POST', body }),
      invalidatesTags: ['Family'],
    }),
    removeFamilyMember: builder.mutation({
      query: (id) => ({ url: `/family/members/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Family'],
    }),
    getEvents: builder.query({
      query: () => '/events',
      providesTags: ['Events'],
    }),
    getEvent: builder.query({
      query: (id) => `/events/${id}`,
      providesTags: ['Events'],
    }),
    createEvent: builder.mutation({
      query: (body) => ({ url: '/events', method: 'POST', body }),
      invalidatesTags: ['Events'],
    }),
    updateEvent: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/events/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Events'],
    }),
    deleteEvent: builder.mutation({
      query: (id) => ({ url: `/events/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Events'],
    }),
    getNews: builder.query({
      query: () => '/news',
      providesTags: ['News'],
    }),
    createNews: builder.mutation({
      query: (body) => ({ url: '/news', method: 'POST', body }),
      invalidatesTags: ['News'],
    }),
    deleteNews: builder.mutation({
      query: (id) => ({ url: `/news/${id}`, method: 'DELETE' }),
      invalidatesTags: ['News'],
    }),
    getInvitations: builder.query({
      query: () => '/invitations',
      providesTags: ['Invitations'],
    }),
    createInvitation: builder.mutation({
      query: (body) => ({ url: '/invitations', method: 'POST', body }),
      invalidatesTags: ['Invitations'],
    }),
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notifications'],
    }),
    markNotificationsRead: builder.mutation({
      query: (ids) => ({ url: '/notifications/read', method: 'POST', body: { ids } }),
      invalidatesTags: ['Notifications'],
    }),
    uploadFile: builder.mutation({
      query: (formData) => ({
        url: '/upload',
        method: 'POST',
        body: formData,
      }),
    }),
    adminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['AdminUsers'],
    }),
    adminUsers: builder.query({
      query: () => '/admin/users',
      providesTags: ['AdminUsers'],
    }),
    adminBan: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/admin/users/${id}/ban`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    adminUnban: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/unban`, method: 'POST' }),
      invalidatesTags: ['AdminUsers'],
    }),
    adminDeleteNews: builder.mutation({
      query: (id) => ({ url: `/admin/news/${id}`, method: 'DELETE' }),
      invalidatesTags: ['News', 'AdminUsers'],
    }),
    adminAnnouncements: builder.query({
      query: () => '/admin/announcements',
    }),
    adminPostAnnouncement: builder.mutation({
      query: (body) => ({ url: '/admin/announcements', method: 'POST', body }),
    }),
    adminEmergency: builder.mutation({
      query: (body) => ({ url: '/admin/emergency', method: 'POST', body }),
    }),
    adminVillages: builder.query({
      query: () => '/admin/villages',
      providesTags: ['Village'],
    }),
    adminVillageDetail: builder.query({
      query: (id) => `/admin/villages/${id}`,
      providesTags: ['Village'],
    }),
    adminUpdateVillageLocation: builder.mutation({
      query: ({ id, lat, lng }) => ({ url: `/admin/villages/${id}/location`, method: 'PATCH', body: { lat, lng } }),
      invalidatesTags: ['Village', 'User'],
    }),
  }),
});

export const {
  useGetMapConfigQuery,
  useGetCountriesQuery,
  useGetStatesQuery,
  useGetDistrictsQuery,
  useGetSubDistrictsQuery,
  useGetLocationVillagesQuery,
  useLazySearchPlacesQuery,
  useGetMyVillageQuery,
  useJoinVillageMutation,
  useCreateCustomVillageMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useGetFamilyQuery,
  useAddFamilyMemberMutation,
  useSetFamilyHeadMutation,
  useRemoveFamilyMemberMutation,
  useGetEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetNewsQuery,
  useCreateNewsMutation,
  useDeleteNewsMutation,
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useUploadFileMutation,
  useAdminStatsQuery,
  useAdminUsersQuery,
  useAdminBanMutation,
  useAdminUnbanMutation,
  useAdminDeleteNewsMutation,
  useAdminAnnouncementsQuery,
  useAdminPostAnnouncementMutation,
  useAdminEmergencyMutation,
  useAdminVillagesQuery,
  useAdminVillageDetailQuery,
  useAdminUpdateVillageLocationMutation,
} = apiSlice;
