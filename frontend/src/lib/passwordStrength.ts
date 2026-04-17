export type PasswordStrengthLevel = "weak" | "medium" | "strong";

export type PasswordStrengthResult = {
  level: PasswordStrengthLevel;
  label: "Low" | "Normal" | "Strong";
  score: number;
  isStrong: boolean;
};

export const getPasswordStrength = (password: string): PasswordStrengthResult => {
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  }

  if (/\d/.test(password)) {
    score += 1;
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }

  if (score >= 5) {
    return {
      level: "strong",
      label: "Strong",
      score,
      isStrong: true,
    };
  }

  if (score >= 3) {
    return {
      level: "medium",
      label: "Normal",
      score,
      isStrong: false,
    };
  }

  return {
    level: "weak",
    label: "Low",
    score,
    isStrong: false,
  };
};
