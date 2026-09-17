"use client";

import dynamic from "next/dynamic";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import DynamicChunkFallback from "../../../../components/common/DynamicChunkFallback";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { fixedLocationPageData } from "../../fixed-location/fixedLocation.data";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "../../../../store/services/profileApi";
import {
  useGetBusinessCategoriesQuery,
  useGetBusinessSetupQuery,
  useUploadBusinessMediaMutation,
  useUpsertBusinessSetupMutation,
} from "../../../../store/services/businessApi";

const ProfessionalFixedLocationSetup = dynamic(
  () => import("../../../../components/common/ProfessionalFixedLocationSetup"),
  { ssr: false, loading: () => <DynamicChunkFallback /> },
);

export default function ProfessionalsProfilePage() {
  const { data } = useGetProfileQuery();
  const { data: businessCategoriesData } = useGetBusinessCategoriesQuery();
  const { data: businessSetupData } = useGetBusinessSetupQuery({
    includeDraft: true,
  });
  const [updateProfile, { isLoading: isProfileSaving }] =
    useUpdateProfileMutation();
  const [upsertBusinessSetup, { isLoading: isBusinessSetupSaving }] =
    useUpsertBusinessSetupMutation();
  const [uploadBusinessMedia, { isLoading: isBusinessMediaUploading }] =
    useUploadBusinessMediaMutation();
  const { showSnackbar } = useSnackbar();

  return (
    <ProfessionalFixedLocationSetup
      data={fixedLocationPageData}
      chrome={false}
      profileData={data?.data ?? null}
      businessCategories={businessCategoriesData?.data ?? []}
      businessSetupData={businessSetupData?.data ?? null}
      isProfileSaving={isProfileSaving}
      isBusinessSetupSaving={isBusinessSetupSaving}
      isBusinessMediaUploading={isBusinessMediaUploading}
      onUploadBusinessMedia={async (files) => {
        try {
          const result = await uploadBusinessMedia(files).unwrap();
          showSnackbar({
            severity: "success",
            message: result.message || "Media uploaded successfully.",
          });
          return result.data.business_media;
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(error, "Unable to upload media."),
          });
          throw error;
        }
      }}
      onSaveProfessionalProfile={async (payload) => {
        try {
          const result = await updateProfile(payload).unwrap();
          showSnackbar({
            severity: "success",
            message:
              result.message || "Professional profile updated successfully.",
          });
          return result.data;
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(
              error,
              "Unable to update professional profile.",
            ),
          });
          throw error;
        }
      }}
      onSaveBusinessSetup={async (payload) => {
        try {
          await upsertBusinessSetup(payload).unwrap();
        } catch (error) {
          showSnackbar({
            severity: "error",
            message: getApiErrorMessage(
              error,
              "Unable to update business setup.",
            ),
          });
          throw error;
        }
      }}
    />
  );
}
