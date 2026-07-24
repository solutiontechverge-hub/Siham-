"use client";

import * as React from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  IconButton,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { MollureTextField } from ".";

export type KeywordTagsInputProps = {
  value: string[];
  onChange: (keywords: string[]) => void;
  maxKeywords?: number;
  placeholder?: string;
  sx?: SxProps<Theme>;
};

export default function KeywordTagsInput({
  value,
  onChange,
  maxKeywords = 3,
  placeholder = "Search Keyword",
  sx,
}: KeywordTagsInputProps) {
  const tokens = useTheme().palette.mollure;
  const [draft, setDraft] = React.useState("");
  const atMax = value.length >= maxKeywords;

  const addKeyword = React.useCallback(() => {
    const next = draft.trim();
    if (!next || atMax) return;
    const exists = value.some((k) => k.toLowerCase() === next.toLowerCase());
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...value, next].slice(0, maxKeywords));
    setDraft("");
  }, [atMax, draft, maxKeywords, onChange, value]);

  const removeKeyword = React.useCallback(
    (keyword: string) => {
      onChange(value.filter((k) => k !== keyword));
    },
    [onChange, value],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addKeyword();
    }
  };

  return (
    <Box>
      {value.length ? (
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ mb: atMax ? 0 : 1.25 }}
        >
          {value.map((keyword) => (
            <Box
              key={keyword}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                pl: 1.5,
                pr: 0.5,
                py: 0.65,
                borderRadius: "10px",
                bgcolor: alpha(tokens.teal, 0.14),
                border: `1.5px solid ${alpha(tokens.teal, 0.45)}`,
                boxShadow: `0 6px 16px ${alpha(tokens.teal, 0.18)}`,
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1.2,
                  color: tokens.tealDark,
                  letterSpacing: "0.01em",
                }}
              >
                {keyword}
              </Typography>
              <IconButton
                size="small"
                aria-label={`Remove ${keyword}`}
                onClick={() => removeKeyword(keyword)}
                sx={{
                  width: 26,
                  height: 26,
                  color: tokens.teal,
                  "&:hover": {
                    bgcolor: alpha(tokens.teal, 0.12),
                    color: tokens.tealDark,
                  },
                }}
              >
                <CloseRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      ) : null}

      {atMax ? (
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: alpha(tokens.navy, 0.5),
            pt: 0.25,
          }}
        >
          Maximum {maxKeywords} keywords added
        </Typography>
      ) : (
        <MollureTextField
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            value.length ? "Press Enter to add another" : placeholder
          }
          sx={sx}
        />
      )}
    </Box>
  );
}
