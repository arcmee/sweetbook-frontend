export type AppRouteKey =
  | "landing"
  | "signup"
  | "login"
  | "dashboard"
  | "account"
  | "groups"
  | "events"
  | "albums"
  | "spreads"
  | "orders";

export type AppRoute = {
  key: AppRouteKey;
  path: string;
  label: string;
  title: string;
  description: string;
  requiresAuth: boolean;
  showInNavigation: boolean;
};

export const appRoutes: AppRoute[] = [
  {
    key: "landing",
    path: "/",
    label: "",
    title: "groupictures 시작 화면",
    description: "회원가입을 시작하거나 기존 계정으로 로그인합니다.",
    requiresAuth: false,
    showInNavigation: false,
  },
  {
    key: "signup",
    path: "/signup",
    label: "",
    title: "groupictures 회원가입",
    description: "그룹과 이벤트에 참여하기 전에 계정을 만듭니다.",
    requiresAuth: false,
    showInNavigation: false,
  },
  {
    key: "login",
    path: "/login",
    label: "",
    title: "groupictures 로그인",
    description: "아이디와 비밀번호로 로그인합니다.",
    requiresAuth: false,
    showInNavigation: false,
  },
  {
    key: "dashboard",
    path: "/app",
    label: "",
    title: "groupictures 시작 화면",
    description: "내 그룹과 지금 해야 할 일을 확인합니다.",
    requiresAuth: true,
    showInNavigation: false,
  },
  {
    key: "account",
    path: "/app/account",
    label: "",
    title: "내 계정",
    description: "내 계정 정보와 그룹, 비밀번호를 관리합니다.",
    requiresAuth: true,
    showInNavigation: false,
  },
  {
    key: "groups",
    path: "/app/groups",
    label: "",
    title: "그룹 페이지",
    description: "선택한 그룹의 이벤트와 멤버를 확인합니다.",
    requiresAuth: true,
    showInNavigation: false,
  },
  {
    key: "events",
    path: "/app/events",
    label: "",
    title: "이벤트 페이지",
    description: "이벤트 사진과 좋아요를 모읍니다.",
    requiresAuth: true,
    showInNavigation: false,
  },
  {
    key: "albums",
    path: "/app/albums",
    label: "",
    title: "책에 넣을 사진 선택",
    description: "책에 넣을 사진과 커버 사진을 먼저 고릅니다.",
    requiresAuth: true,
    showInNavigation: false,
  },
  {
    key: "spreads",
    path: "/app/spreads",
    label: "",
    title: "스프레드 구성",
    description: "선택한 사진을 페이지에 배치해 책 구성을 확인합니다.",
    requiresAuth: true,
    showInNavigation: false,
  },
  {
    key: "orders",
    path: "/app/orders",
    label: "",
    title: "주문 전달",
    description: "최종 구성을 확인하고 SweetBook 주문을 진행합니다.",
    requiresAuth: true,
    showInNavigation: false,
  },
];

export const defaultRouteKey: AppRouteKey = "landing";

export function getRouteByKey(routeKey: AppRouteKey): AppRoute {
  const route = appRoutes.find((item) => item.key === routeKey);

  if (!route) {
    throw new Error(`Unknown route: ${routeKey}`);
  }

  return route;
}

export function getRouteByPath(pathname: string): AppRoute {
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";
  const route =
    appRoutes.find((item) => item.path === normalizedPathname) ??
    appRoutes.find((item) => item.path === pathname);

  if (!route) {
    return getRouteByKey(defaultRouteKey);
  }

  return route;
}
