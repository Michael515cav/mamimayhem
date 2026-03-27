const PRINTIFY_TOKEN = process.env.PRINTIFY_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (!PRINTIFY_TOKEN || !SHOP_ID) {
    return res.status(500).json({ error: 'Missing environment variables.' });
  }

  try {
    const response = await fetch(
      `https://api.printify.com/v1/shops/${SHOP_ID}/products.json?limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${PRINTIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();

    // Debug: return raw fields so we can see exactly what Printify sends
    if (req.query.debug === '1') {
      return res.status(200).json({
        total: data.data?.length,
        products: data.data?.map(p => ({
          id: p.id,
          title: p.title,
          visible: p.visible,
          published: p.published,
          status: p.status,
        }))
      });
    }

    // Filter: only show products that are visible (published to Pop-Up Store)
    const products = (data.data || [])
      .filter(p => p.visible === true)
      .map(p => {
        const variant = p.variants?.find(v => v.is_enabled) || p.variants?.[0];
        const image = p.images?.find(i => i.is_default) || p.images?.[0];
        return {
          id: p.id,
          title: p.title,
          price: variant ? (variant.price / 100).toFixed(2) : null,
          image: image ? image.src : null,
          url: `https://mamimayhem.printify.me/products/${p.id}`,
          tags: p.tags || [],
        };
      });

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ products });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
