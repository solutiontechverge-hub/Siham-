"use client";

import * as React from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Checkbox, Paper, Radio, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useListboxKeyboard } from "../../../hooks/useListboxKeyboard";
import { resolveListboxNavKey } from "../../../lib/keyboard";
import { BodyText } from "../../ui/typography";

export type RefundSelectOption = {
  value: string;
  label: string;
};

type RefundSalesSelectFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  options: readonly RefundSelectOption[];
  onChange: (value: string) => void;
  /** When set, only one field in the group can be open at a time. */
  selectId?: string;
  openSelectId?: string | null;
  onOpenSelectIdChange?: (id: string | null) => void;
  /** Visual style for options in the open panel. */
  optionStyle?: "radio" | "checkbox";
  checkboxAlign?: "left" | "right";
  highlightBorderWhenValue?: boolean;
};

export default function RefundSalesSelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
  optionStyle = "radio",
  checkboxAlign = "left",
  highlightBorderWhenValue = false,
  selectId,
  openSelectId,
  onOpenSelectIdChange,
}: RefundSalesSelectFieldProps) {
  const m = useTheme().palette.mollure;
  const [localOpen, setLocalOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const listboxId = React.useId();

  const usesGroup = Boolean(selectId && onOpenSelectIdChange);
  const open = usesGroup ? openSelectId === selectId : localOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (usesGroup && selectId) {
        onOpenSelectIdChange?.(next ? selectId : null);
        return;
      }
      setLocalOpen(next);
    },
    [onOpenSelectIdChange, selectId, usesGroup],
  );

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  const selectAt = React.useCallback(
    (index: number) => {
      const next = options[index];
      if (!next) return;
      onChange(next.value);
      setOpen(false);
    },
    [onChange, options, setOpen],
  );

  const {
    highlightIndex,
    setHighlightIndex,
    itemRefs,
    handleListKeyDown,
  } = useListboxKeyboard({
    length: options.length,
    open,
    resetKey: open ? "open" : "closed",
    onSelect: selectAt,
    spaceSelects: true,
  });

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, setOpen]);

  const borderColor =
    open || (highlightBorderWhenValue && value) ? m.teal : alpha(m.navy, 0.12);

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    const action = resolveListboxNavKey(e.key, highlightIndex, options.length, {
      spaceSelects: true,
    });
    if (action.type === "close") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    handleListKeyDown(e);
  };

  return (
    <Box ref={rootRef}>
      <BodyText
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color: alpha(m.navy, 0.55),
          mb: 0.75,
        }}
      >
        {label}
      </BodyText>
      <Box
        role="combobox"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
        onKeyDown={handleTriggerKeyDown}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1.1,
          borderRadius: "10px",
          border: `1px solid ${borderColor}`,
          bgcolor: "#fff",
          cursor: "pointer",
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: selectedLabel ? alpha(m.navy, 0.78) : alpha(m.navy, 0.45),
          }}
        >
          {selectedLabel ?? placeholder}
        </Typography>
        <ExpandMoreRoundedIcon
          sx={{
            fontSize: 20,
            color: alpha(m.navy, 0.45),
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 160ms ease",
          }}
        />
      </Box>

      {open ? (
        <Paper
          id={listboxId}
          role="listbox"
          elevation={0}
          sx={{
            mt: 1,
            borderRadius: "10px",
            border: `1px solid ${alpha(m.navy, 0.1)}`,
            boxShadow: "0 10px 22px rgba(16, 35, 63, 0.06)",
            overflow: "hidden",
          }}
        >
          {options.map((opt, index) => {
            const active = value === opt.value;
            const highlighted = index === highlightIndex;
            const checkboxNode =
              optionStyle === "checkbox" ? (
                <Checkbox
                  size="small"
                  checked={active}
                  tabIndex={-1}
                  disableRipple
                  sx={{
                    p: 0.25,
                    pointerEvents: "none",
                    color: alpha(m.navy, 0.25),
                    "&.Mui-checked": { color: m.teal },
                  }}
                />
              ) : null;

            return (
              <Box
                key={opt.value}
                role="option"
                aria-selected={active}
                tabIndex={-1}
                ref={(el: HTMLDivElement | null) => {
                  itemRefs.current[index] = el;
                }}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => selectAt(index)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  px: 1.75,
                  py: 1.15,
                  cursor: "pointer",
                  bgcolor:
                    highlighted || active ? alpha(m.teal, 0.08) : "#fff",
                  borderBottom:
                    index < options.length - 1
                      ? `1px solid ${alpha(m.navy, 0.06)}`
                      : 0,
                }}
              >
                {optionStyle === "checkbox" && checkboxAlign === "left"
                  ? checkboxNode
                  : null}
                <Typography
                  sx={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 700,
                    color: alpha(m.navy, 0.78),
                  }}
                >
                  {opt.label}
                </Typography>
                {optionStyle === "radio" ? (
                  <Radio
                    checked={active}
                    tabIndex={-1}
                    disableRipple
                    sx={{
                      p: 0.5,
                      pointerEvents: "none",
                      color: alpha(m.navy, 0.25),
                      "&.Mui-checked": { color: m.teal },
                    }}
                  />
                ) : null}
                {optionStyle === "checkbox" && checkboxAlign === "right"
                  ? checkboxNode
                  : null}
              </Box>
            );
          })}
        </Paper>
      ) : null}
    </Box>
  );
}
