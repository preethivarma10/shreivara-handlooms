# Shreivara Handlooms

A storefront for Shreivara sarees and jewellery.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `OWNER_EMAIL` to the email address of the Netlify Identity account that may manage products.
4. Install the Netlify CLI if needed (`npm install -g netlify-cli`), link the project to your Netlify site, then start the app and local services with `netlify dev`.

Apply pending migrations to the local database with `netlify database migrations apply` while local development is running. Netlify Identity authentication does not work in local development, so verify the owner console on a Deploy Preview.

## Deployment

Enable Netlify Identity for the site and create or invite the owner account. Set these variables in the Netlify site environment:

- `OWNER_EMAIL`: server-side function variable matching the owner's Netlify Identity email. Make it available to Functions.

Netlify Database is used to store the catalogue. The committed migrations create the products table, seed the initial catalogue, and add optional offer details and sizes; deploy the site to provision/apply them. Netlify Database requires a Credit-based plan. The owner can sign in directly at `/login` (the login link is hidden from the storefront), then open the console at `/?admin=true`. The owner console supports adding, editing, and deleting sarees, including their name, category, prices, offer details, sizes, and image. JPEG/PNG/WebP image uploads are limited to 5 MB; when editing a product, its image can be kept or replaced. Uploaded images are stored in Netlify Blobs and served through the site's image function.

WhatsApp links use the store's public contact number, `+91 90005 10329`, defined in `src/data/products.js`. Update that constant and redeploy if the shop's WhatsApp number changes. Remove any old `VITE_WHATSAPP_NUMBER` setting from Netlify so it cannot cause confusion.

The site footer links to the shop at `shreivara@gmail.com` using `mailto:` and to WhatsApp using the public contact number. Add an Instagram profile link after the shop's account handle is available.

## Customer orders

Customers place orders through the product's WhatsApp link. The storefront does not collect customer email addresses or phone numbers for order tracking.

## Environment variable safety

Local `.env` files are ignored by Git; `.env.example` is the committed template. Never put secrets in variables prefixed with `VITE_`: Vite embeds them in browser code, where visitors can see them. The WhatsApp number is public contact information, not a secret. Product writes and owner authorization are handled by Netlify Functions; database credentials are supplied by Netlify Database and are never sent to the browser.
