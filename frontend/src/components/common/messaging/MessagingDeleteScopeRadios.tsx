"use client";

import {
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export type MessagingDeleteScopeOption = "me" | "everyone";

/** Shared delete-scope radios for chat/message dialogs. */
export default function MessagingDeleteScopeRadios({
  value,
  onChange,
  showEveryone = true,
  labelOpacity = 0.7,
}: {
  value: MessagingDeleteScopeOption;
  onChange: (next: MessagingDeleteScopeOption) => void;
  showEveryone?: boolean;
  labelOpacity?: number;
}) {
  const m = useTheme().palette.mollure;
  const radioSx = {
    color: alpha(m.navy, 0.35),
    "&.Mui-checked": { color: m.teal },
  };
  const labelSx = {
    fontSize: 13,
    fontWeight: 700,
    color: alpha(m.navy, labelOpacity),
  };

  return (
    <RadioGroup
      value={value}
      onChange={(_, next) => onChange(next as MessagingDeleteScopeOption)}
    >
      <FormControlLabel
        value="me"
        control={<Radio size="small" sx={radioSx} />}
        label={<Typography sx={labelSx}>Delete for me</Typography>}
      />
      {showEveryone ? (
        <FormControlLabel
          value="everyone"
          control={<Radio size="small" sx={radioSx} />}
          label={<Typography sx={labelSx}>Delete for everyone</Typography>}
        />
      ) : null}
    </RadioGroup>
  );
}
