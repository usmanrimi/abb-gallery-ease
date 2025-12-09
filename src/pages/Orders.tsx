import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle2, Truck, ChevronRight } from "lucide-react";
import { formatPrice } from "@/data/categories";

// Mock orders data
const mockOrders = [
  {
    id: "ORD-ABC123",
    packageName: "Sallah Essentials",
    className: "VIP",
    quantity: 2,
    totalPrice: 300000,
    status: "pending",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "ORD-DEF456",
    packageName: "Bridal Complete",
    className: "Special",
    quantity: 1,
    totalPrice: 350000,
    status: "processing",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "ORD-GHI789",
    packageName: "Baby Welcome",
    className: "Standard",
    quantity: 1,
    totalPrice: 80000,
    status: "delivered",
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
];

const statusConfig = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    variant: "secondary" as const,
    description: "We're reviewing your order",
  },
  processing: {
    label: "Processing",
    icon: Package,
    variant: "default" as const,
    description: "Your order is being prepared",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    variant: "default" as const,
    description: "On the way to you",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    variant: "outline" as const,
    description: "Order completed",
  },
};

export default function Orders() {
  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">My Orders</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display">My Orders</h1>
          <p className="mt-2 text-muted-foreground">
            Track and manage your orders
          </p>
        </div>

        {mockOrders.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                Start shopping to see your orders here
              </p>
              <Link to="/categories">
                <Button>Browse Packages</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {mockOrders.map((order, i) => {
              const status = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <Card
                  key={order.id}
                  variant="interactive"
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-muted-foreground">
                            {order.id}
                          </span>
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{order.packageName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.className} Class • Qty: {order.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ordered on{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-xl font-bold">{formatPrice(order.totalPrice)}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          {Object.entries(statusConfig).map(([key, config], index) => {
                            const Icon = config.icon;
                            const isActive =
                              Object.keys(statusConfig).indexOf(order.status) >= index;
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    isActive
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                {index < Object.keys(statusConfig).length - 1 && (
                                  <div
                                    className={`h-0.5 w-8 sm:w-12 ${
                                      Object.keys(statusConfig).indexOf(order.status) > index
                                        ? "bg-primary"
                                        : "bg-muted"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {status.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
