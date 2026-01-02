import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { packages, formatPrice } from "@/data/categories";
import { Package, ImageIcon } from "lucide-react";

export default function AdminPackages() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Packages</h1>
          <p className="text-muted-foreground">Manage your product packages and pricing</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative flex items-center justify-center">
                {pkg.image && pkg.image !== "/placeholder.svg" ? (
                  <img
                    src={pkg.image}
                    alt={pkg.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                    <span className="text-xs">No image assigned</span>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {pkg.description}
                </p>
                
                {pkg.startingPrice && (
                  <p className="text-sm font-medium text-primary">
                    Starting from {formatPrice(pkg.startingPrice)}
                  </p>
                )}

                {pkg.hasClasses && pkg.classes && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Classes & Pricing
                    </p>
                    <div className="space-y-1">
                      {pkg.classes.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-background flex items-center justify-center">
                              {cls.image ? (
                                <img
                                  src={cls.image}
                                  alt={cls.name}
                                  className="w-full h-full object-contain rounded"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium">{cls.name}</span>
                          </div>
                          <span className="font-semibold text-primary">
                            {formatPrice(cls.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!pkg.hasClasses && pkg.basePrice && (
                  <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                    <span className="font-medium">Fixed Price</span>
                    <span className="font-semibold text-primary">
                      {formatPrice(pkg.basePrice)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Image Management</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              To assign or update package images, please contact the system administrator 
              or use the file upload feature when available.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
