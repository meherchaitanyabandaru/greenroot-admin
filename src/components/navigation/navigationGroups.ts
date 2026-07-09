import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import HistoryIcon from '@mui/icons-material/History';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaymentsIcon from '@mui/icons-material/Payments';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SmsIcon from '@mui/icons-material/Sms';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import TimelineIcon from '@mui/icons-material/Timeline';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import type { SvgIconComponent } from '@mui/icons-material';

export type NavItem = { label: string; path: string; icon: SvgIconComponent; badge?: string };
export type NavGroup = { section: string; items: NavItem[] };

export const navigationGroups: NavGroup[] = [
  {
    section: '',
    items: [{ label: 'Dashboard', path: '/', icon: DashboardIcon }],
  },
  {
    section: 'People',
    items: [
      { label: 'All Users', path: '/users', icon: PeopleIcon },
      { label: 'Drivers', path: '/drivers', icon: AccountTreeIcon },
    ],
  },
  {
    section: 'Nurseries',
    items: [
      { label: 'All Nurseries', path: '/nurseries', icon: StorefrontIcon },
      { label: 'Pending Approvals', path: '/nurseries/applications', icon: CheckCircleOutlineIcon },
      { label: 'Inventory', path: '/inventory', icon: InventoryIcon },
    ],
  },
  {
    section: 'Plant Catalogue',
    items: [
      { label: 'Plants', path: '/plants', icon: LocalFloristIcon },
      { label: 'Categories', path: '/plants/categories', icon: CategoryIcon },
    ],
  },
  {
    section: 'Sourcing Network',
    items: [
      { label: 'Network Members', path: '/sourcing-network', icon: StorefrontIcon },
      { label: 'Need & Availability Posts', path: '/sourcing-posts', icon: TravelExploreIcon },
    ],
  },
  {
    section: 'Sales',
    items: [
      { label: 'Quotations', path: '/quotations', icon: DescriptionIcon },
      { label: 'Orders', path: '/orders', icon: ReceiptLongIcon },
      { label: 'Plant Requests', path: '/requests', icon: AssignmentIcon },
    ],
  },
  {
    section: 'Logistics',
    items: [
      { label: 'Dispatches', path: '/dispatches', icon: LocalShippingIcon },
      { label: 'Vehicles', path: '/vehicles', icon: DirectionsCarIcon },
      { label: 'Live Tracking', path: '/tracking', icon: TimelineIcon },
    ],
  },
  {
    section: 'Billing',
    items: [
      { label: 'Subscription Plans', path: '/subscription-plans', icon: SubscriptionsIcon },
      { label: 'Active Subscriptions', path: '/subscriptions', icon: SubscriptionsIcon },
      { label: 'Promo Offers', path: '/subscription-promos', icon: LocalOfferIcon },
      { label: 'Payments', path: '/payments', icon: PaymentsIcon },
    ],
  },
  {
    section: 'Communication',
    items: [
      { label: 'Notifications', path: '/notifications', icon: NotificationsIcon },
      { label: 'Templates', path: '/notifications/templates', icon: SmsIcon },
      { label: 'Notification Devices', path: '/notifications/devices', icon: NotificationsIcon },
    ],
  },
  {
    section: 'Media',
    items: [
      { label: 'Attachments', path: '/attachments', icon: AttachFileIcon },
    ],
  },
  {
    section: 'Logs',
    items: [
      { label: 'Audit Logs',    path: '/audit',         icon: HistoryIcon },
      { label: 'Security Logs', path: '/security-logs', icon: GppMaybeIcon },
    ],
  },
];
