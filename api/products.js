const PRINTIFY_TOKEN = process.env.PRINTIFY_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

function getCategory(product) {
  const text = (product.title + ' ' + (product.tags || []).join(' ')).toLowerCase();
  if (text.includes('sweatshirt') || text.includes('crewneck') || text.includes('hoodie')) return 'Sweatshirts';
  if (text.includes('sticker')) return 'Stickers';
  if (text.includes('standee')) return 'Collectibles';
  if (text.includes('consent is') || text.includes('consent is couture')) return 'Consent Is Couture';
  if (text.includes('spooky') || text.includes('halloween') || text.includes('horror') || text.includes('ghost') || text.includes('witch') || text.includes('ghoul') || text.includes('grinch') || text.includes('haunt') || text.includes('hex') || text.includes('slayboy') || text.includes('final girl') || text.includes('resting witch')) return 'Spooky';
  if (text.includes('construction') || text.includes('roofer') || text.includes('osha') || text.includes('safety third') || text.includes('jobsite') || text.includes('estimate') || text.includes('no harness') || text.includes('built like')) return 'Construction';
  if (text.includes('christmas') || text.includes('xmas') || text.includes('sleigh') || text.includes('holiday') || text.includes('winter')) return 'Holiday';
  if (text.includes('goddess') || text.includes('aura') || text.includes('mystic') || text.includes('spiritual') || text.includes('psychic') || text.includes('divine') || text.includes('witchy') || text.includes('tarot') || text.includes('delulu')) return 'Mystical';
  return 'Tees';
}

function shapeProduct(p) {
  const isPublished = p.visible === true && p.external && p.external.id;
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
    published: !!isPublished,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (!PRINTIFY_TOKEN || !SHOP_ID) {
    return res.status(500).json({ error: 'Missing environment variables.' });
  }

  // Single page mode — frontend requests one page at a time
  const page = parseInt(req.query.page || '1', 10);

  try {
    const apiRes = await fetch(
      `https://api.printify.com/v1/shops/${SHOP_ID}/products.json?limit=50&page=${page}`,
      { headers: { 'Authorization': `Bearer ${PRINTIFY_TOKEN}` } }
    );

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return res.status(apiRes.status).json({ error: text });
    }

    const data = await apiRes.json();
    const batch = data.data || [];

    if (req.query.debug === '1') {
      return res.status(200).json({
        page,
        count: batch.length,
        has_more: batch.length === 50,
        sample: batch.slice(0, 3).map(p => ({
          id: p.id,
          title: p.title.substring(0, 60),
          visible: p.visible,
          external: p.external,
        }))
      });
    }

    const products = batch.map(shapeProduct);
    const hasMore = batch.length === 50;

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ products, hasMore, page });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
