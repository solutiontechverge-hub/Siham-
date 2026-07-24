"use client";

import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type Props = {
  readByPeer: boolean;
};

export default function MessagingReadReceipt({ readByPeer }: Props) {
  const m = useTheme().palette.mollure;
  const color = readByPeer ? m.teal : alpha(m.navy, 0.38);

  return (
    <Box
      component="span"
      aria-label={readByPeer ? "Seen" : "Sent"}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        lineHeight: 0,
        ml: 0.25,
      }}
    >
      {readByPeer ? (
        <DoneAllRoundedIcon sx={{ fontSize: 14, color }} />
      ) : (
        <DoneRoundedIcon sx={{ fontSize: 14, color }} />
      )}
    </Box>
  );
}
