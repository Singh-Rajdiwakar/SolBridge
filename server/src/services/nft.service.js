import { NFT } from "../models/NFT.js";
import { buildExplorerAddressUrl } from "./solana.service.js";

const fallbackNfts = [
  {
    mint: "9u9oAgz8b51nixJXrqfJrKXwLm6h65XL6L1dYv1YBNa1",
    name: "Retix Genesis #042",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=900&q=80&auto=format&fit=crop",
    collection: "Retix Genesis",
    description: "Genesis access collectible for early Retix Wallet users.",
    attributes: [
      { traitType: "Tier", value: "Genesis" },
      { traitType: "Access", value: "Early" },
    ],
  },
  {
    mint: "6kBz4xXWZsQv2mX7S13LJHgo7mUmTe7R8dWQnSSeS7V3",
    name: "Blue Ledger #118",
    image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=900&q=80&auto=format&fit=crop",
    collection: "Blue Ledger",
    description: "Premium ledger-themed collectible with technical neon styling.",
    attributes: [
      { traitType: "Rarity", value: "Rare" },
      { traitType: "Theme", value: "Blue Neon" },
    ],
  },
];

function mapNft(record, owner) {
  const nft = record.toObject ? record.toObject() : record;
  return {
    ...nft,
    owner,
    explorerUrl: buildExplorerAddressUrl(nft.mint),
  };
}

export async function listWalletNfts(owner) {
  const nfts = await NFT.find({ owner }).sort({ createdAt: -1 });
  if (nfts.length > 0) {
    return nfts.map((nft) => mapNft(nft, owner));
  }

  return fallbackNfts.map((nft) => mapNft(nft, owner));
}
