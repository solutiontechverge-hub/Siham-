import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

export const KPI_ICONS: Record<string, SvgIconComponent> = {
  professionals: BusinessOutlinedIcon,
  clients: PeopleOutlinedIcon,
  bookings: EventAvailableOutlinedIcon,
  reviews: StarOutlineOutlinedIcon,
  reported: FlagOutlinedIcon,
};
