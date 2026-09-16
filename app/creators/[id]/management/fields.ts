export type ManagementFieldConfig = {
  key: string;
  label: string;
  // "Active IG accounts" is computed from real Account rows instead of
  // manually entered — the other rows have no reliable source in the data
  // model yet (a banned account may not even be tracked as an Account
  // anymore), so those stay manual entry for now.
  derived?: boolean;
  showAccountNames: boolean;
};

export const INSTAGRAM_ACCOUNT_FIELDS: ManagementFieldConfig[] = [
  { key: "active_ig_accounts", label: "Active IG accounts", derived: true, showAccountNames: true },
  { key: "in_warmup", label: "In warmup", showAccountNames: true },
  { key: "banned_30d", label: "Banned accounts (last 30 days)", showAccountNames: true },
  { key: "recovered", label: "Of which recovered", showAccountNames: true },
];

export const CONTENT_CAPACITY_FIELDS: ManagementFieldConfig[] = [
  { key: "weekly_videos", label: "How many videos can be done weekly?", showAccountNames: false },
  { key: "weekly_variations", label: "How many variations can be done?", showAccountNames: false },
  {
    key: "scale_up",
    label: "Possible to scale up? (More Accounts, Editor, Variations)",
    showAccountNames: false,
  },
];

export const ALL_MANAGEMENT_FIELDS = [
  ...INSTAGRAM_ACCOUNT_FIELDS,
  ...CONTENT_CAPACITY_FIELDS,
];
