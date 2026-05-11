export const getDefaultRouteForUser = (userType?: string) => {
  if (userType === "individual" || userType === "company") {
    return "/clients/listing";
  }

  if (userType === "professional") {
    return "/professionals/profile";
  }

  return "/clients/profile";
};
