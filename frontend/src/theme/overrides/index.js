import Fab from '@/theme/overrides/Fab';
import Card from '@/theme/overrides/Card';
import Chip from '@/theme/overrides/Chip';
import Tabs from '@/theme/overrides/Tabs';
import Menu from '@/theme/overrides/Menu';
import Link from '@/theme/overrides/Link';
import Lists from '@/theme/overrides/List';
import Table from '@/theme/overrides/Table';
import Alert from '@/theme/overrides/Alert';
import Badge from '@/theme/overrides/Badge';
import Paper from '@/theme/overrides/Paper';
import Input from '@/theme/overrides/Input';
import Radio from '@/theme/overrides/Radio';
import Drawer from '@/theme/overrides/Drawer';
import Dialog from '@/theme/overrides/Dialog';
import Avatar from '@/theme/overrides/Avatar';
import Rating from '@/theme/overrides/Rating';
import Slider from '@/theme/overrides/Slider';
import Button from '@/theme/overrides/Button';
import Switch from '@/theme/overrides/Switch';
import Select from '@/theme/overrides/Select';
import SvgIcon from '@/theme/overrides/SvgIcon';
import Tooltip from '@/theme/overrides/Tooltip';
import Popover from '@/theme/overrides/Popover';
import Stepper from '@/theme/overrides/Stepper';
import DataGrid from '@/theme/overrides/DataGrid';
import Skeleton from '@/theme/overrides/Skeleton';
import Backdrop from '@/theme/overrides/Backdrop';
import Progress from '@/theme/overrides/Progress';
import Timeline from '@/theme/overrides/Timeline';
import TreeView from '@/theme/overrides/TreeView';
import Checkbox from '@/theme/overrides/Checkbox';
import Accordion from '@/theme/overrides/Accordion';
import Typography from '@/theme/overrides/Typography';
import Pagination from '@/theme/overrides/Pagination';
import Breadcrumbs from '@/theme/overrides/Breadcrumbs';
import ButtonGroup from '@/theme/overrides/ButtonGroup';
import CssBaseline from '@/theme/overrides/CssBaseline';
import Autocomplete from '@/theme/overrides/Autocomplete';
import ToggleButton from '@/theme/overrides/ToggleButton';
import ControlLabel from '@/theme/overrides/ControlLabel';
import LoadingButton from '@/theme/overrides/LoadingButton';

export default function ComponentsOverrides(theme) {
  return Object.assign(
    Fab(theme),
    Tabs(theme),
    Chip(theme),
    Card(theme),
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
    Rating(theme),
    Dialog(theme),
    Avatar(theme),
    Slider(theme),
    Drawer(theme),
    Stepper(theme),
    Tooltip(theme),
    Popover(theme),
    SvgIcon(theme),
    Checkbox(theme),
    DataGrid(theme),
    Skeleton(theme),
    Timeline(theme),
    TreeView(theme),
    Backdrop(theme),
    Progress(theme),
    Accordion(theme),
    Typography(theme),
    Pagination(theme),
    ButtonGroup(theme),
    Breadcrumbs(theme),
    CssBaseline(theme),
    Autocomplete(theme),
    ControlLabel(theme),
    ToggleButton(theme),
    LoadingButton(theme)
  );
}
