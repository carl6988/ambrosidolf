export type ManagementFieldConfig = {
  key: string;
  label: string;
  showAccountNames: boolean;
};

export const CONTENT_CAPACITY_FIELDS: ManagementFieldConfig[] = [
  { key: "weekly_videos", label: "How many videos can be done weekly?", showAccountNames: false },
  { key: "weekly_variations", label: "How many variations can be done?", showAccountNames: false },
  {
    key: "scale_up",
    label: "Possible to scale up? (More Accounts, Editor, Variations)",
    showAccountNames: false,
  },
];

export const ALL_MANAGEMENT_FIELDS = [...CONTENT_CAPACITY_FIELDS];
