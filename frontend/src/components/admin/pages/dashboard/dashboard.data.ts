import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

export const KPI_ICONS: Record<string, SvgIconComponent> = {
  business: BusinessOutlinedIcon,
  people: PeopleOutlinedIcon,
  person: PersonOutlineOutlinedIcon,
  company: ApartmentOutlinedIcon,
  online: EventAvailableOutlinedIcon,
  offline: StorefrontOutlinedIcon,
};
