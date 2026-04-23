"use client";

import FixedLocationPageScaffold from "../../../../components/common/FixedLocationPageScaffold";
import ProfessionalFixedLocationSetup from "../../../../components/common/ProfessionalFixedLocationSetup";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { fixedLocationPageData } from "../fixedLocation.data";
import { fixedLocationTopTabs } from "../fixedLocationTopTabs";
import { useGetProfileQuery, useUpdateProfileMutation } from "../../../../store/services/profileApi";

export default function FixedLocationProfilePage() {
  const { data } = useGetProfileQuery();
  const [updateProfile, { isLoading: isProfileSaving }] = useUpdateProfileMutation();
  const { showSnackbar } = useSnackbar();

  return (
    <FixedLocationPageScaffold activeTopTab="Profile" topTabs={fixedLocationTopTabs}>
      <ProfessionalFixedLocationSetup
        data={fixedLocationPageData}
        chrome={false}
        profileData={data?.data ?? null}
        isProfileSaving={isProfileSaving}
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
      />
    </FixedLocationPageScaffold>
  );
}

