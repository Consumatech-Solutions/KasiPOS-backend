import { DataSource } from 'typeorm';
import { MarketplaceStore } from '../../marketplace-stores/entities/marketplace-store.entity';

export async function seedMarketplaceStores(
  dataSource: DataSource,
): Promise<void> {
  const marketplaceStoreRepository = dataSource.getRepository(MarketplaceStore);

  // Check if stores already exist
  const existingStores = await marketplaceStoreRepository.count();
  if (existingStores > 0) {
    console.log('Marketplace stores already exist, skipping seed');
    return;
  }

  const marketplaceStores = [
    {
      code: 'takealot',
      name: 'Takealot',
      logoUrl: 'https://placehold.co/200x100/00549F/FFFFFF?text=Takealot',
      description:
        "South Africa's leading online store for electronics, appliances, and more.",
      isActive: true,
    },
    {
      code: 'amazon',
      name: 'Amazon',
      logoUrl: 'https://placehold.co/200x100/FF9900/000000?text=amazon',
      description: 'Global marketplace for millions of products from A to Z.',
      isActive: true,
    },
    {
      code: 'makro',
      name: 'Makro',
      logoUrl: 'https://placehold.co/200x100/D9002D/FFFFFF?text=Makro',
      description:
        'Big on life. Get everything you need for your home and business.',
      isActive: true,
    },
    {
      code: 'temu',
      name: 'Temu',
      logoUrl: 'https://placehold.co/200x100/F26322/FFFFFF?text=Temu',
      description:
        'Shop like a billionaire with deals on fashion, home, and tech.',
      isActive: true,
    },
    {
      code: 'checkers-hyper',
      name: 'Checkers Hyper',
      logoUrl: 'https://placehold.co/200x100/D9231D/FFFFFF?text=Checkers+Hyper',
      description:
        'Better and better deals on a wide range of groceries and goods.',
      isActive: true,
    },
    {
      code: 'pnp-hyper',
      name: 'Pick n Pay Hyper',
      logoUrl: 'https://placehold.co/200x100/00479C/FFFFFF?text=PnP+Hyper',
      description:
        'Your one-stop shop for groceries, clothing, and general merchandise.',
      isActive: true,
    },
    {
      code: 'bash',
      name: 'Bash',
      logoUrl: 'https://placehold.co/200x100/000000/FFFFFF?text=Bash',
      description:
        'The home of fashion. Shop the latest trends from your favourite brands.',
      isActive: true,
    },
    {
      code: 'tfg',
      name: 'TFG',
      logoUrl: 'https://placehold.co/200x100/0033A0/FFFFFF?text=TFG',
      description:
        'A diverse portfolio of fashion, jewellery, and homeware brands.',
      isActive: true,
    },
  ];

  for (const storeData of marketplaceStores) {
    const store = marketplaceStoreRepository.create(storeData);
    await marketplaceStoreRepository.save(store);
    console.log(`✅ Created marketplace store: ${store.name}`);
  }

  console.log(
    `✅ Successfully seeded ${marketplaceStores.length} marketplace stores`,
  );
}
