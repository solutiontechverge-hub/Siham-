export type BusinessSetupOffering = "Fixed Location" | "Desired Location" | "Both";

export type BusinessSetupPublishValidationInput = {
  offering: BusinessSetupOffering;
  profileName: string;
  about: string;
  keywords: string[];
  mediaCount: number;
  fixedLocation: {
    salonName: string;
    streetAddress: string;
    streetNumber: string;
    postalCode: string;
    province: string;
    municipalities: string[];
  };
  desiredLocation: {
    areaMode: "Specific areas only" | "All Netherlands";
    areasCount: number;
  };
  serviceFor: { men: boolean; women: boolean; kids: boolean };
  servicesFixedCount: number;
  servicesDesiredCount: number;
  servicesDetailsSync: boolean;
  manageTeamSync: boolean;
  portfolioSync: boolean;
  teamMembersFixed: Array<{ name: string; role: string }>;
  teamMembersDesired: Array<{ name: string; role: string }>;
  portfolioFixedCount: number;
  portfolioDesiredCount: number;
  notes: string;
  policyResponseHours: string;
  policyResponseMinutes: string;
  policyInstructions: string;
  rescheduleMinimumHours: string;
  rescheduleMinimumMinutes: string;
  rescheduleLateFeePercent: string;
  rescheduleInstructions: string;
  cancelMinimumHours: string;
  cancelMinimumMinutes: string;
  cancelLateFeePercent: string;
  cancelInstructions: string;
  noShowFeePercent: string;
  noShowInstructions: string;
};

const isBlank = (value: string | null | undefined) =>
  !String(value ?? "").trim();

const hasTimeValue = (hours: string, minutes: string) =>
  !isBlank(hours) || !isBlank(minutes);

function validateTeamMembers(
  members: Array<{ name: string; role: string }>,
  label: string,
  missing: string[],
) {
  if (members.length === 0) {
    missing.push(label);
    return;
  }
  const hasIncompleteMember = members.some(
    (member) => isBlank(member.name) || isBlank(member.role),
  );
  if (hasIncompleteMember) {
    missing.push(`${label} member details`);
  }
}

export function validateBusinessSetupForPublish(
  input: BusinessSetupPublishValidationInput,
): { valid: boolean; missingFields: string[] } {
  const missing: string[] = [];

  const requireField = (condition: boolean, label: string) => {
    if (condition) missing.push(label);
  };

  requireField(isBlank(input.profileName), "Name");
  requireField(isBlank(input.about), "About");
  requireField(input.keywords.length === 0, "Keywords");
  requireField(input.mediaCount === 0, "Profile media");

  if (input.offering === "Fixed Location" || input.offering === "Both") {
    requireField(isBlank(input.fixedLocation.salonName), "Salon name");
    requireField(isBlank(input.fixedLocation.streetAddress), "Street address");
    requireField(isBlank(input.fixedLocation.streetNumber), "Street number");
    requireField(isBlank(input.fixedLocation.postalCode), "Postal code");
    requireField(isBlank(input.fixedLocation.province), "Province");
    requireField(
      input.fixedLocation.municipalities.length === 0,
      "Municipality",
    );
  }

  if (input.offering === "Desired Location" || input.offering === "Both") {
    if (input.desiredLocation.areaMode === "Specific areas only") {
      requireField(
        input.desiredLocation.areasCount === 0,
        "Desired service areas",
      );
    }
  }

  const anyServiceFor =
    input.serviceFor.men || input.serviceFor.women || input.serviceFor.kids;
  requireField(!anyServiceFor, "Service For");

  if (input.offering === "Fixed Location" || input.offering === "Both") {
    requireField(input.servicesFixedCount === 0, "Categories and services");
  }
  if (
    input.offering === "Desired Location" ||
    (input.offering === "Both" && !input.servicesDetailsSync)
  ) {
    requireField(
      input.servicesDesiredCount === 0,
      "Desired categories and services",
    );
  }

  if (input.offering === "Fixed Location" || input.offering === "Both") {
    validateTeamMembers(input.teamMembersFixed, "Manage team", missing);
  }
  if (
    input.offering === "Desired Location" ||
    (input.offering === "Both" && !input.manageTeamSync)
  ) {
    validateTeamMembers(
      input.teamMembersDesired,
      "Desired manage team",
      missing,
    );
  }

  if (input.offering === "Fixed Location" || input.offering === "Both") {
    requireField(input.portfolioFixedCount === 0, "Portfolio");
  }
  if (
    input.offering === "Desired Location" ||
    (input.offering === "Both" && !input.portfolioSync)
  ) {
    requireField(input.portfolioDesiredCount === 0, "Desired portfolio");
  }

  requireField(isBlank(input.notes), "Additional notes");
  requireField(
    !hasTimeValue(input.policyResponseHours, input.policyResponseMinutes),
    "Response time",
  );
  requireField(isBlank(input.policyInstructions), "Policy instructions");
  requireField(
    !hasTimeValue(
      input.rescheduleMinimumHours,
      input.rescheduleMinimumMinutes,
    ),
    "Reschedule minimum time",
  );
  requireField(
    isBlank(input.rescheduleLateFeePercent),
    "Late rescheduling fee",
  );
  requireField(
    isBlank(input.rescheduleInstructions),
    "Rescheduling instructions",
  );
  requireField(
    !hasTimeValue(input.cancelMinimumHours, input.cancelMinimumMinutes),
    "Cancellation minimum time",
  );
  requireField(isBlank(input.cancelLateFeePercent), "Late cancellation fee");
  requireField(isBlank(input.cancelInstructions), "Cancellation instructions");
  requireField(isBlank(input.noShowFeePercent), "No-show fee");
  requireField(isBlank(input.noShowInstructions), "No-show instructions");

  return { valid: missing.length === 0, missingFields: missing };
}

export function formatBusinessSetupValidationMessage(
  missingFields: string[],
): string {
  if (missingFields.length === 0) return "";
  if (missingFields.length === 1) {
    return `Please fill in the required field: ${missingFields[0]}.`;
  }
  return `Please fill in all required fields before publishing: ${missingFields.join(", ")}.`;
}
