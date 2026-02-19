import { pool } from '../db/pool.js';

export async function findLocalProducts(query) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM products
    WHERE platform = 'mercadolivre'
      AND title ILIKE '%' || $1 || '%'
      AND created_at::date = CURRENT_DATE
    ORDER BY score DESC
    LIMIT 10
    `,
    [query]
  );

  return rows;
}

export async function insertProduct(product) {
  await pool.query(
    `
    INSERT INTO products
    (
      platform,
      external_id,
      title,
      thumbnail,
      price,
      product_url,
      affiliate_url,
      score,
      active
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
    ON CONFLICT (platform, external_id) DO NOTHING
    `,
    [
      product.platform,
      product.external_id,
      product.title,
      product.thumbnail,
      product.price,
      product.product_url,
      product.affiliate_url,
      product.score
    ]
  );
}
