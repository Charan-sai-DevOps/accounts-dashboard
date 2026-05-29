export interface ReminderSettings {
  before7Days: boolean;
  before3Days: boolean;
  onDay: boolean;
}

export interface NotificationSettings {
  monthlySpendSummary: boolean;
  newSubscriptionAdded: boolean;
}

export interface AppSettings {
  email: string;
  reminders: ReminderSettings;
  notifications: NotificationSettings;
}

export const defaultAppSettings: AppSettings = {
  email: "",
  reminders: {
    before7Days: true,
    before3Days: true,
    onDay: false,
  },
  notifications: {
    monthlySpendSummary: true,
    newSubscriptionAdded: false,
  },
};
