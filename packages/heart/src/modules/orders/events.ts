// Facts the orders module announces after its transaction commits.
declare module '../../platform/events/index.ts' {
  interface HeartEvents {
    'order.placed': { orderId: string; orderNumber: string; paid: boolean };
    'order.cancelled': { orderId: string; orderNumber: string; refunded: boolean };
  }
}
export {};
