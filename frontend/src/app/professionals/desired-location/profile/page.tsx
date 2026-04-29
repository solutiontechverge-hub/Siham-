"use client";

import DesiredLocationPageScaffold from "../../../../components/common/DesiredLocationPageScaffold";
import ProfessionalDesiredLocationSetup from "../../../../components/common/ProfessionalDesiredLocationSetup";
import { useSnackbar } from "../../../../components/common/AppSnackbar";
import { getApiErrorMessage } from "../../../../lib/api-error";
import { desiredLocationPageData } from "../desiredLocation.data";
import { desiredLocationTopTabs } from "../desiredLocationTopTabs";
import { useGetProfileQuery, useUpdateProfileMutation } from "../../../../store/services/profileApi";

export default function DesiredLocationProfilePage() {
  const { data } = useGetProfileQuery();
  const [updateProfile, { isLoading: isProfileSaving }] = useUpdateProfileMutation();
  const { showSnackbar } = useSnackbar();

  return (
    <DesiredLocationPageScaffold activeTopTab="Profile" topTabs={desiredLocationTopTabs}>
      <ProfessionalDesiredLocationSetup
        data={desiredLocationPageData}
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
    </DesiredLocationPageScaffold>
  );
}

