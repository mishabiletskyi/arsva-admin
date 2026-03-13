import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: Props) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems={{ xs: "flex-start", md: "center" }}
      justifyContent="space-between"
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </Box>
      {action ? (
        <Box
          sx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
            "& > *": {
              width: { xs: "100%", md: "auto" },
            },
          }}
        >
          {action}
        </Box>
      ) : null}
    </Stack>
  );
}
