const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export const normalizeOrganizationId = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (OBJECT_ID_RE.test(trimmed)) {
      return trimmed;
    }

    try {
      return normalizeOrganizationId(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const candidates = [
    record.id,
    record._id,
    record.ID,
    record.Id,
    record.organization_id,
    record.organizationId,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeOrganizationId(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

export const getStoredOrganizationId = (): string | null => {
  const raw = localStorage.getItem('OrganizationID');
  const normalized = normalizeOrganizationId(raw);

  if (normalized && normalized !== raw) {
    localStorage.setItem('OrganizationID', normalized);
  }

  return normalized;
};

