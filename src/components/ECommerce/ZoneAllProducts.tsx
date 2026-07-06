import { motion } from 'framer-motion';
import { Product } from '../../data/mockProducts';
import CreativeProductCard from './CreativeProductCard';
import ThematicZone from './ThematicZone';

interface ZoneAllProductsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ZoneAllProducts({
  products,
  onProductClick,
  onAddToCart,
}: ZoneAllProductsProps) {
  // Create asymmetric masonry layout
  const getSize = (index: number): 'small' | 'medium' | 'large' => {
    const pattern = [0, 1, 2, 3, 4, 5];
    const sizeIndex = index % pattern.length;
    const sizes: ('small' | 'medium' | 'large')[] = ['large', 'medium', 'small', 'medium', 'large', 'small'];
    return sizes[sizeIndex];
  };

  const getSpan = (index: number): string => {
    const pattern = [0, 1, 2, 3, 4, 5];
    const spanIndex = index % pattern.length;
    const spans = ['col-span-2', 'col-span-1', 'col-span-1', 'col-span-2', 'col-span-1', 'col-span-1'];
    return spans[spanIndex];
  };

  return (
    <ThematicZone
      title="All Products"
      subtitle="Browse our complete collection"
      gradient="from-indigo-50/30 via-blue-50/15 to-indigo-50/30 dark:from-indigo-900/10 dark:via-blue-900/5 dark:to-indigo-900/10"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className={`${getSpan(index)}`}
          >
            <CreativeProductCard
              product={product}
              onAddToCart={onAddToCart}
              onClick={() => onProductClick(product)}
              size={getSize(index)}
            />
          </motion.div>
        ))}
      </div>
    </ThematicZone>
  );
}

