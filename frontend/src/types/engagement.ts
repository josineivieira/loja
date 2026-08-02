export type Review = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  title?: string | null;
  comment: string;
  status: string;
  verified_purchase: boolean;
  admin_reply?: string | null;
  created_at: string;
};

export type TrackingEvent = {
  status: string;
  location?: string | null;
  description: string;
  created_at: string;
};

export type Tracking = {
  order_number: string;
  tracking_number?: string | null;
  carrier?: string | null;
  status: string;
  events: TrackingEvent[];
};

export type Notification = {
  id: string;
  audience: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  related_order_number?: string | null;
  created_at: string;
};

