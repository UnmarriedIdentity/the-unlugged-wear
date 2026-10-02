# The Unplugged Wear — Separate project folders

- tuw-website/: customer website.
- tuw-admin/: admin panel, using Urbanist and the V2 design system.

Open either folder independently. This archive contains the requested folder structure and starter configuration templates, not a functioning Next.js application. There are no installed dependencies, working pages, real credentials or database migrations. The admin design folder includes the V2 SVGs and local Figma import plugin.

Before implementation, choose ownership of shared commerce logic and database migrations so the two applications do not duplicate pricing, payment or fulfillment rules. Register each partner webhook once and use durable jobs for fulfillment retries.
