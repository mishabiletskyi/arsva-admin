import { Card, CardContent } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function SectionCard({ children }: Props) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid rgba(17, 24, 39, 0.08)",
        borderRadius: 3,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))",
        backdropFilter: "blur(10px)",
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>{children}</CardContent>
    </Card>
  );
}
