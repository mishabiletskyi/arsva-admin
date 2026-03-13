import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMeRequest, loginRequest, registerManagerRequest } from "../../api/auth.api";
import {
  getOrganizationsRequest,
  getPropertiesRequest,
} from "../../api/platform.api";
import type {
  CurrentUser,
  LoginPayload,
  RegisterManagerPayload,
} from "../../types/auth";
import type {
  AppRole,
  AuthScopeSelection,
  CurrentUserMembership,
} from "../../types/access";
import type { Organization, Property } from "../../types/platform";
import {
  clearStoredScopeSelection,
  getAccessToken,
  getStoredScopeSelection,
  removeAccessToken,
  setAccessToken,
  setStoredScopeSelection,
} from "../../utils/storage";

type AuthContextValue = {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isScopeLoading: boolean;
  isPlatformOwner: boolean;
  organizations: Organization[];
  properties: Property[];
  scope: AuthScopeSelection;
  currentOrganization: Organization | null;
  currentProperty: Property | null;
  currentMembership: CurrentUserMembership | null;
  currentRole: AppRole | null;
  canManageOrganizations: boolean;
  canManageAdminUsers: boolean;
  canEditCurrentScope: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  registerManager: (payload: RegisterManagerPayload) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setSelectedOrganization: (organizationId: number | null) => void;
  setSelectedProperty: (propertyId: number | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const EMPTY_SCOPE: AuthScopeSelection = {
  organizationId: null,
  propertyId: null,
};

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scope, setScope] = useState<AuthScopeSelection>(() => getStoredScopeSelection());

  const isAuthenticated = Boolean(user);
  const isPlatformOwner = Boolean(
    user?.role_ui === "owner" || user?.is_platform_owner || user?.is_superuser
  );

  const organizationsQuery = useQuery({
    queryKey: ["organizations", user?.id ?? "guest"],
    queryFn: () => getOrganizationsRequest({ limit: 100 }),
    enabled: isAuthenticated && isPlatformOwner,
    staleTime: 60_000,
  });

  const propertiesQuery = useQuery({
    queryKey: ["properties", user?.id ?? "guest", scope.organizationId],
    queryFn: () =>
      getPropertiesRequest({
        organization_id: scope.organizationId ?? undefined,
        limit: 100,
      }),
    enabled: isAuthenticated && scope.organizationId !== null,
    staleTime: 60_000,
  });

  const organizations = useMemo<Organization[]>(() => {
    if (isPlatformOwner) {
      return organizationsQuery.data ?? [];
    }

    if (!user?.current_organization) {
      return [];
    }

    return [
      {
        id: user.current_organization.id,
        name: user.current_organization.name,
        slug: `org-${user.current_organization.id}`,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ];
  }, [isPlatformOwner, organizationsQuery.data, user?.current_organization]);

  const properties = useMemo<Property[]>(() => {
    const queriedProperties = propertiesQuery.data ?? [];
    if (queriedProperties.length > 0) {
      return queriedProperties;
    }

    if (isPlatformOwner) {
      return queriedProperties;
    }

    const organizationId = user?.current_organization?.id ?? scope.organizationId ?? 0;
    return (user?.available_properties ?? []).map((property) => ({
      id: property.id,
      organization_id: organizationId,
      name: property.name,
      timezone: property.timezone,
      address_line: null,
      city: null,
      state: null,
      is_active: true,
      created_at: "",
      updated_at: "",
    }));
  }, [
    isPlatformOwner,
    propertiesQuery.data,
    scope.organizationId,
    user?.available_properties,
    user?.current_organization?.id,
  ]);

  const isScopeLoading =
    (isPlatformOwner && organizationsQuery.isLoading) || propertiesQuery.isLoading;

  const currentOrganization =
    organizations.find((organization) => organization.id === scope.organizationId) ?? null;
  const currentProperty =
    properties.find((property) => property.id === scope.propertyId) ?? null;
  const currentMembership =
    user?.memberships.find(
      (membership) =>
        membership.organization_id === scope.organizationId && membership.is_active
    ) ?? null;
  const currentRole: AppRole | null = useMemo(() => {
    if (user?.role_ui === "owner") {
      return "platform_owner";
    }

    if (user?.role_ui === "manager") {
      return "property_manager";
    }

    if (user?.role_ui === "viewer") {
      return "viewer";
    }

    if (isPlatformOwner) {
      return "platform_owner";
    }

    return currentMembership?.role ?? null;
  }, [currentMembership?.role, isPlatformOwner, user?.role_ui]);
  const canManageOrganizations = isPlatformOwner;
  const canManageAdminUsers = isPlatformOwner;
  const canEditCurrentScope =
    currentRole !== null &&
    currentRole !== "viewer" &&
    scope.organizationId !== null;

  function syncScope(nextScope: AuthScopeSelection) {
    setScope(nextScope);
    setStoredScopeSelection(nextScope.organizationId, nextScope.propertyId);
  }

  function clearScope() {
    setScope(EMPTY_SCOPE);
    clearStoredScopeSelection();
  }

  function setSelectedOrganization(organizationId: number | null) {
    setScope((currentScope) => {
      const nextScope: AuthScopeSelection = {
        organizationId,
        propertyId:
          currentScope.organizationId === organizationId
            ? currentScope.propertyId
            : null,
      };

      setStoredScopeSelection(nextScope.organizationId, nextScope.propertyId);
      return nextScope;
    });
  }

  function setSelectedProperty(propertyId: number | null) {
    setScope((currentScope) => {
      const nextScope: AuthScopeSelection = {
        ...currentScope,
        propertyId,
      };

      setStoredScopeSelection(nextScope.organizationId, nextScope.propertyId);
      return nextScope;
    });
  }

  async function refreshMe() {
    try {
      const me = await getMeRequest();
      setUser(me);
    } catch {
      removeAccessToken();
      setUser(null);
      clearScope();
      queryClient.clear();
    }
  }

  async function login(payload: LoginPayload) {
    const tokenResponse = await loginRequest(payload);
    setAccessToken(tokenResponse.access_token);
    await refreshMe();
  }

  async function registerManager(payload: RegisterManagerPayload) {
    const tokenResponse = await registerManagerRequest(payload);
    setAccessToken(tokenResponse.access_token);
    await refreshMe();
  }

  function logout() {
    removeAccessToken();
    setUser(null);
    clearScope();
    queryClient.clear();
  }

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    refreshMe().finally(() => {
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || organizationsQuery.isLoading) {
      return;
    }

    if (organizations.length === 0) {
      if (scope.organizationId !== null || scope.propertyId !== null) {
        clearScope();
      }
      return;
    }

    if (
      scope.organizationId === null ||
      !organizations.some((organization) => organization.id === scope.organizationId)
    ) {
      const preferredOrganizationId = user?.current_organization?.id ?? organizations[0].id;
      syncScope({
        organizationId: preferredOrganizationId,
        propertyId: null,
      });
    }
  }, [
    isAuthenticated,
    organizations,
    organizationsQuery.isLoading,
    scope.organizationId,
    scope.propertyId,
    user?.current_organization?.id,
  ]);

  useEffect(() => {
    if (!isAuthenticated || scope.organizationId === null || propertiesQuery.isLoading) {
      return;
    }

    if (properties.length === 0) {
      if (scope.propertyId !== null) {
        syncScope({
          organizationId: scope.organizationId,
          propertyId: null,
        });
      }
      return;
    }

    if (
      scope.propertyId === null ||
      !properties.some((property) => property.id === scope.propertyId)
    ) {
      const preferredPropertyId =
        user?.current_property_id && properties.some((property) => property.id === user.current_property_id)
          ? user.current_property_id
          : properties[0].id;
      syncScope({
        organizationId: scope.organizationId,
        propertyId: preferredPropertyId,
      });
    }
  }, [
    isAuthenticated,
    properties,
    propertiesQuery.isLoading,
    scope.organizationId,
    scope.propertyId,
    user?.current_property_id,
  ]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      isScopeLoading,
      isPlatformOwner,
      organizations,
      properties,
      scope,
      currentOrganization,
      currentProperty,
      currentMembership,
      currentRole,
      canManageOrganizations,
      canManageAdminUsers,
      canEditCurrentScope,
      login,
      registerManager,
      logout,
      refreshMe,
      setSelectedOrganization,
      setSelectedProperty,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      isScopeLoading,
      isPlatformOwner,
      organizations,
      properties,
      scope,
      currentOrganization,
      currentProperty,
      currentMembership,
      currentRole,
      canManageOrganizations,
      canManageAdminUsers,
      canEditCurrentScope,
      registerManager,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
