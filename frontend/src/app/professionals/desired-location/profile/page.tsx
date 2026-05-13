"use client";

import dynamic from "next/dynamic";
import { Box, CircularProgress } from "@mui/material";
import DesiredLocationPageScaffold from "../../../../components/common/DesiredLocationPageScaffold";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { desiredLocationPageData } from "../desiredLocation.data";
import { desiredLocationTopTabs } from "../desiredLocationTopTabs";
import { useGetProfileQuery, useUpdateProfileMutation } from "../../../../store/services/profileApi";
import {
  useGetBusinessCategoriesQuery,
  useGetBusinessSetupQuery,
  useUpsertBusinessSetupMutation,
} from "../../../../store/services/businessApi";

const ProfessionalDesiredLocationSetup = dynamic(
  () => import("../../../../components/common/ProfessionalDesiredLocationSetup"),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    ),
  },
);

export default function DesiredLocationProfilePage() {
  const { data } = useGetProfileQuery();
  const { data: businessCategoriesData } = useGetBusinessCategoriesQuery();
  const { data: businessSetupData } = useGetBusinessSetupQuery();
  const [updateProfile, { isLoading: isProfileSaving }] = useUpdateProfileMutation();
  const [upsertBusinessSetup, { isLoading: isBusinessSetupSaving }] = useUpsertBusinessSetupMutation();
  const { showSnackbar } = useSnackbar();

  return (
    <DesiredLocationPageScaffold activeTopTab="Profile" topTabs={desiredLocationTopTabs}>
      <ProfessionalDesiredLocationSetup
        data={desiredLocationPageData}
        chrome={false}
        profileData={data?.data ?? null}
        businessCategories={businessCategoriesData?.data ?? []}
        businessSetupData={businessSetupData?.data ?? null}
        isProfileSaving={isProfileSaving}
        isBusinessSetupSaving={isBusinessSetupSaving}
        onSaveProfessionalProfile={async (payload) => {
          try {
            const result = await updateProfile(payload).unwrap();
            showSnackbar({
              severity: "success",
              message: result.message || "Professional profile updated successfully.",
            });
          } catch (error) {
            showSnackbar({
              severity: "error",
              message: getApiErrorMessage(error, "Unable to update professional profile."),
            });
            throw error;
          }
        }}
        onSaveBusinessSetup={async (payload) => {
          try {
            const result = await upsertBusinessSetup(payload).unwrap();
            showSnackbar({
              severity: "success",
              message: result.message || "Business setup updated successfully.",
            });
          } catch (error) {
            showSnackbar({
              severity: "error",
              message: getApiErrorMessage(error, "Unable to update business setup."),
            });
            throw error;
          }
        }}
      />
    </DesiredLocationPageScaffold>
  );
}

