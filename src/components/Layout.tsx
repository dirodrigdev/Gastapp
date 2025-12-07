// Layout.tsx
const currentUser = localStorage.getItem('currentUser');

// 👉 quiénes pueden ver la pestaña Viajes
const canSeeTrips =
  currentUser === 'Diego' || currentUser === 'Gastón';

const navItems = [
  {
    to: '/',
    label: 'Inicio',
    icon: HomeIcon,
  },
  {
    to: '/history',
    label: 'Historial',
    icon: Clock,
  },
  {
    to: '/trips',
    label: 'Viajes',
    icon: Plane,
    onlyTripsUsers: true,   // renombramos para que tenga más sentido
  },
  {
    to: '/reports',
    label: 'Informes',
    icon: PieChart,
  },
  {
    to: '/settings',
    label: 'Ajustes',
    icon: SettingsIcon,
  },
];

...

<nav ...>
  <div className="max-w-md mx-auto flex justify-between px-4 pt-1.5 pb-3">
    {navItems
      .filter((item) =>
        !item.onlyTripsUsers ? true : canSeeTrips
      )
      .map((item) => {
        const isActive = location.pathname === item.to;
        const Icon = item.icon;
        ...
      })}
  </div>
</nav>
