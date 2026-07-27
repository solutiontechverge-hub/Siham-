export const getDefaultRouteForUser = (userType?: string) => {
  if (userType === "admin") {
    return "/admin/dashboard";
  }

  if (userType === "individual" || userType === "company") {
    return "/clients/listing";
  }

  if (userType === "professional") {
    return "/professionals/profile";
  }

  return "/clients/profile";
};

export const getLoginRouteForPath = (pathname?: string | null) => {
  if (pathname?.startsWith("/admin")) {
    return "/auth/admin/login";
  }
  return "/auth/login";
};
