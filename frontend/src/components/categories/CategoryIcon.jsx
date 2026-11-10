import { Shirt, Blocks, Wheat, Sparkles, Package } from "lucide-react";

export function CategoryIcon({ slug, size = 22, ...props }) {
  const Icon =
    { roupas: Shirt, brinquedos: Blocks, alimentos: Wheat, higiene: Sparkles }[
      slug
    ] || Package;
  return <Icon size={size} {...props} />;
}
