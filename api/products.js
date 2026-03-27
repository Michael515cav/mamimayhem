const PRINTIFY_TOKEN = process.env.PRINTIFY_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

function getCategory(product) {
  const text = (product.title + ' ' + (product.tags || []).join(' ')).toLowerCase();
  if (text.includes('sweatshirt') || text.includes('crewneck') || text.includes('hoodie')) return 'Sweatshirts';
  if (text.includes('sticker')) return 'Stickers';
  if (text.includes('standee')) return 'Collectibles';
  if (text.includes('consent is couture') || text.includes('consent is')) return 'Consent Is Couture';
  if (text.includes('spooky') || text.includes('halloween') || text.includes('horror') || text.includes('ghost') || text.includes('witch') || text.includes('ghoul') || text.includes('grinch') || text.includes('boozy babe') || text.includes('haunt') || text.includes('hex') || text.includes('slayboy') || text.includes('final girl') || text.includes('crystal slut') || text.includes('resting witch')) return 'Spooky';
  if (text.includes('construction') || text.includes('roofer') || text.includes('osha') || text.includes('safety third') || text.includes('jobsite') || text.includes('hardhat') || text.includes('hard hat') || text.includes('estimate') || text.includes('no harness') || text.includes('built like')) return 'Construction';
  if (text.includes('christmas') || text.includes('xmas') || text.includes('sleigh') || text.includes('holiday') || text.includes('winter') || text.includes('puffer girl')) return 'Holiday';
  if (text.includes('goddess') || text.includes('aura') || text.includes('mystic') || text.includes('spiritual') || text.includes('psychic') || text.includes('divine') || text.includes('witchy') || text.includes('tarot') || text.includes('delulu') || text.includes('chaos')) return 'Mystical';
  return 'Tees';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (!PRINTIFY_TOKEN || !SHOP_ID) {
    return res.status(500).json({ error: 'Missing environment variables.' });
  }

  try {
    // Fetch page by page — stop early once we have all products
    let allProducts = [];
    let page = 1;

    while (true) {
      const res2 = await fetch(
        `https://api.printify.com/v1/shops/${SHOP_ID}/products.json?limit=50&page=${page}`,
        { headers: { 'Authorization': `Bearer ${PRINTIFY_TOKEN}` } }
      );

      if (!res2.ok) throw new Error(await res2.text());
      const data = await res2.json();
      const batch = data.data || [];
      allProducts = allProducts.concat(batch);

      if (batch.length < 50) break;
      if (page >= 20) break; // hard cap at 1000 products
      page++;
    }

    // Debug: show raw publish fields on first 10 products
    if (req.query.debug === '1') {
      return res.status(200).json({
        total: allProducts.length,
        pages_fetched: page,
        sample: allProducts.slice(0, 10).map(p => ({
          id: p.id,
          title: p.title.substring(0, 50),
          visible: p.visible,
          published: p.published,
          is_locked: p.is_locked,
          sales_channel_properties: p.sales_channel_properties,
          external: p.external,
        }))
      });
    }

    // published = visible true AND has external sales channel set (popup store)
    // external.id being set means it's been published to a sales channel
    const products = allProducts.map(p => {
      const hasExternal = p.external && p.external.id;
      const isPublished = p.visible === true && hasExternal;
      const variant = p.variants?.find(v => v.is_enabled) || p.variants?.[0];
      const image = p.images?.find(i => i.is_default) || p.images?.[0];
      return {
        id: p.id,
        title: p.title,
        price: variant ? (variant.price / 100).toFixed(2) : null,
        image: image ? image.src : null,
        url: isPublished ? `https://mamimayhem.printify.me/products/${p.id}` : null,
        tags: p.tags || [],
        category: isPublished ? getCategory(p) : 'Coming Soon',
        published: isPublished,
      };
    });

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ products });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
