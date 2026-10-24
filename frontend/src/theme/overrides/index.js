import Chip from "@/theme/overrides/Chip";
import Tabs from "@/theme/overrides/Tabs";
import Menu from "@/theme/overrides/Menu";
import Link from "@/theme/overrides/Link";
import Lists from "@/theme/overrides/List";
import Table from "@/theme/overrides/Table";
import Alert from "@/theme/overrides/Alert";
import Badge from "@/theme/overrides/Badge";
import Paper from "@/theme/overrides/Paper";
import Input from "@/theme/overrides/Input";
import Radio from "@/theme/overrides/Radio";
import Drawer from "@/theme/overrides/Drawer";
import Dialog from "@/theme/overrides/Dialog";
import Avatar from "@/theme/overrides/Avatar";
import Slider from "@/theme/overrides/Slider";
import Button from "@/theme/overrides/Button";
import Switch from "@/theme/overrides/Switch";
import Select from "@/theme/overrides/Select";
import SvgIcon from "@/theme/overrides/SvgIcon";
import Tooltip from "@/theme/overrides/Tooltip";
import Popover from "@/theme/overrides/Popover";
import Skeleton from "@/theme/overrides/Skeleton";
import Backdrop from "@/theme/overrides/Backdrop";
import Checkbox from "@/theme/overrides/Checkbox";
import Accordion from "@/theme/overrides/Accordion";
import Typography from "@/theme/overrides/Typography";
import CssBaseline from "@/theme/overrides/CssBaseline";
import ControlLabel from "@/theme/overrides/ControlLabel";
import LoadingButton from "@/theme/overrides/LoadingButton";

export default function ComponentsOverrides(theme) {
  return Object.assign(
    Tabs(theme),
    Chip(theme),
    Menu(theme),
    Link(theme),
    Input(theme),
    Radio(theme),
    Badge(theme),
    Lists(theme),
    Table(theme),
    Paper(theme),
    Alert(theme),
    Switch(theme),
    Select(theme),
    Button(theme),
    Dialog(theme),
    Avatar(theme),
    Slider(theme),
    Drawer(theme),
    Tooltip(theme),
    Popover(theme),
    SvgIcon(theme),
    Checkbox(theme),
    Skeleton(theme),
    Backdrop(theme),
    Accordion(theme),
    Typography(theme),
    CssBaseline(theme),
    ControlLabel(theme),
    LoadingButton(theme)
  );
}
