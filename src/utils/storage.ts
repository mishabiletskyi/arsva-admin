const ACCESS_TOKEN_KEY = "arsva_access_token";
const ORGANIZATION_SCOPE_KEY = "arsva_selected_organization_id";
const PROPERTY_SCOPE_KEY = "arsva_selected_property_id";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function parseStoredId(rawValue: string | null): number | null {
  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

export function getStoredScopeSelection(): {
  organizationId: number | null;
  propertyId: number | null;
} {
  return {
    organizationId: parseStoredId(localStorage.getItem(ORGANIZATION_SCOPE_KEY)),
    propertyId: parseStoredId(localStorage.getItem(PROPERTY_SCOPE_KEY)),
  };
}

export function setStoredScopeSelection(
  organizationId: number | null,
  propertyId: number | null
): void {
  if (organizationId === null) {
    localStorage.removeItem(ORGANIZATION_SCOPE_KEY);
  } else {
    localStorage.setItem(ORGANIZATION_SCOPE_KEY, String(organizationId));
  }

  if (propertyId === null) {
    localStorage.removeItem(PROPERTY_SCOPE_KEY);
  } else {
    localStorage.setItem(PROPERTY_SCOPE_KEY, String(propertyId));
  }
}

export function clearStoredScopeSelection(): void {
  localStorage.removeItem(ORGANIZATION_SCOPE_KEY);
  localStorage.removeItem(PROPERTY_SCOPE_KEY);
}
