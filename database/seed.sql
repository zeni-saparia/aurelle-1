-- AURELLE seed data. Run AFTER schema.sql in the Supabase SQL editor.

delete from public.product_images; delete from public.products; delete from public.categories;

insert into public.categories (name, slug, description, image_url, sort_order) values
('Showpieces & Figurines','showpieces','Brass swans, jewelled elephants, lions and sculptural pieces for consoles and shelves.','/assets/categories/showpieces.jpg',1),
('Wall Décor','wall-decor','Metal florals and statement pieces for empty walls.','/assets/categories/wall-decor.jpg',2),
('Mirrors & Clocks','mirrors-clocks','Leaf clocks that give walls a focal point.','/assets/categories/mirrors-clocks.jpg',3),
('Vases & Planters','vases-planters','Glossy ceramics, dried stems and ribbed vases.','/assets/categories/vases-planters.jpg',4),
('Lighting','lighting','Amber pendants and table lamps that warm a room.','/assets/categories/lighting.jpg',5),
('Tabletop & Festive','tabletop','Tealight holders, lidded bowls and plates for festive tables.','/assets/categories/tabletop.jpg',6);

insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-13AE92','twin-swan-brass-showpiece','Twin Swan Brass Showpiece','A graceful pair of swans with a hand-polished, mirror-bright finish. Styled on a stack of books, they bring a quiet shine to consoles, shelves and coffee tables.',id,'brass-heritage',2499,1999,22,'Solid brass, antique gold finish','L 24 cm × H 20 cm (pair)','{"Antique Gold"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,true,true,96,now() - interval '0 days',
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-DE957F','jewelled-elephant-figurine','Jewelled Elephant Figurine','A cheerful elephant dressed in a jewelled blanket and crown, inspired by festive processions. A traditional gift for housewarmings.',id,'festive-glow',1899,null,30,'Resin with metallic finish, faux-stone inlay','H 18 cm × W 14 cm','{"Ivory","Blue"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,true,true,84,now() - interval '1 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-9D93B0','serene-buddha-bust','Serene Buddha Bust with Wooden Base','A calm, closed-eye Buddha bust that sets a peaceful tone in a reading corner, entryway or meditation nook.',id,'botanical-boho',1599,null,26,'Polyresin stone finish, mango-wood base','H 22 cm × W 13 cm','{"Stone White"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,false,false,51,now() - interval '2 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-29602D','tall-ship-wooden-model','Tall Ship Wooden Model','A three-masted sailing ship model with striped sails and a polished stand. A statement piece for a study or living-room shelf.',id,'modern-living',3299,2799,12,'Hand-assembled wood, cotton sails','L 45 cm × H 42 cm','{"Navy & White"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,false,false,29,now() - interval '3 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-943DD0','golden-ginkgo-leaf-sculpture','Golden Ginkgo Leaf Sculpture','Fan-shaped ginkgo leaves rise from a white base in a graceful, asymmetrical sweep that catches light from every angle.',id,'brass-heritage',2799,null,18,'Powder-coated iron, gold finish, marble base','H 38 cm × W 30 cm','{"Gold"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,true,false,63,now() - interval '4 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-B4E8B1','floral-medallion-metal-wall-art','Floral Medallion Metal Wall Art','Layered enamel blooms inside a gold ring: a ready-made focal point for an empty living-room or entryway wall.',id,'brass-heritage',4999,3999,14,'Wrought iron, hand-painted enamel','Ø 75 cm','{"Teal & Gold"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,true,true,77,now() - interval '5 days'
from public.categories where slug = 'wall-decor';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-95DD72','gilded-leaf-wall-clock','Gilded Leaf Wall Clock','A leaf-shaped clock with a silent sweep movement, so it looks beautiful and doesn''t tick.',id,'brass-heritage',3799,3199,16,'Metal with gold finish, silent sweep movement','H 60 cm × W 50 cm','{"Gold"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,false,false,39,now() - interval '12 days'
from public.categories where slug = 'mirrors-clocks';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-FA3B8A','noir-gloss-vase-with-white-blooms','Noir Gloss Vase with White Blooms','A glossy black vase arranged with lifelike white blooms. Zero watering, all the drama.',id,'modern-living',1999,null,25,'Glazed ceramic, artificial blooms','H 45 cm (with stems)','{"Black & White"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,true,true,92,now() - interval '13 days'
from public.categories where slug = 'vases-planters';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-12DC82','pampas-duo-ceramic-vase-set','Pampas Duo Ceramic Vase Set','Two slim ceramic vases with feathery pampas stems for a soft, boho corner.',id,'botanical-boho',2199,1799,30,'Ceramic vases, dried pampas stems','Set of 2 · H 20 cm & 14 cm','{"Black & White"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,false,true,81,now() - interval '14 days'
from public.categories where slug = 'vases-planters';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-5E8959','ribbed-terracotta-bud-vase','Ribbed Terracotta Bud Vase','A vertically ribbed terracotta vase, ideal for a single stem or a few dried sprigs.',id,'botanical-boho',1299,null,40,'Terracotta, ribbed finish','H 28 cm × Ø 14 cm','{"Terracotta"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,false,false,55,now() - interval '15 days'
from public.categories where slug = 'vases-planters';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-CB98A9','amber-glass-pendant-light','Amber Glass Pendant Light','A warm amber globe that casts a golden glow over dining tables, stair wells and reading corners. E27 bulb not included.',id,'brass-heritage',5999,4999,11,'Hand-blown amber glass, brass cap','Ø 28 cm × drop 120 cm (adjustable)','{"Amber"}'::text[],'{"Care": "Dust with a soft, dry cloth", "Origin": "Handcrafted in India"}'::jsonb,true,true,61,now() - interval '17 days'
from public.categories where slug = 'lighting';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A10000','gilded-lion-statue','Gilded Lion Statue','A proud lion in a mirror-bright gilded finish, a bold statement for a console, study or entryway.',id,'brass-heritage',5499,4499,15,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,true,false,10,now() - interval '1 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A11EEF','gold-branch-marble-base-sculpture','Gold Branch Sculpture on Marble Base','Sculpted gold branches rising from a black marble base: quiet drama for a shelf or side table.',id,'brass-heritage',3299,2799,16,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,true,13,now() - interval '2 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A13DDE','tree-of-life-brass-ring-on-wooden-base','Tree of Life Ring on Wooden Base','A cut-out tree of life in a golden ring, set on a solid wooden base.',id,'brass-heritage',1999,null,17,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,false,16,now() - interval '3 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A15CCD','handpainted-floral-wreath-showpiece','Hand-painted Floral Wreath Showpiece','A colourful ring of hand-painted blossoms with feather accents, a cheerful accent for a console or shelf.',id,'festive-glow',2199,1799,18,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,false,19,now() - interval '4 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A17BBC','stag-pair-showpiece','Stag Pair Showpiece','A resting and a standing stag with gilded antlers, in a textured bronze-tone finish.',id,'modern-living',2799,2299,19,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,false,22,now() - interval '5 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A19AAB','contemplation-figurine-trio','Contemplation Figurine Trio','Three abstract seated figures in a warm sand finish, in graduated poses for a console or coffee table.',id,'modern-living',2599,null,20,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,true,25,now() - interval '6 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A1B99A','embrace-abstract-couple-sculpture','Embrace Abstract Couple Sculpture','A softly sculpted pair in a matte sand finish, a gift-worthy piece for any shelf.',id,'modern-living',2399,1999,21,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,true,false,28,now() - interval '7 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A1D889','standing-figure-blue-orb-sculpture','Standing Figure with Blue Orb Sculpture','A slim dark figure balancing a bright blue orb on a slim plinth.',id,'modern-living',1899,null,22,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,false,31,now() - interval '8 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A1F778','climbing-elephant-family-shelf-sitters','Climbing Elephant Family Shelf Sitters','A mother and calf elephants resting on the edge of a shelf while another hangs from the ledge.',id,'botanical-boho',1499,1199,23,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,false,34,now() - interval '9 days'
from public.categories where slug = 'showpieces';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A21667','sleek-ceramic-vase-trio','Sleek Ceramic Vase Trio','Three slim ceramic vases in noir, coral and ivory with a high-gloss finish.',id,'modern-living',1899,1499,24,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,false,37,now() - interval '10 days'
from public.categories where slug = 'vases-planters';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A23556','dried-lotus-pod-stems','Dried Lotus Pod Stems','Long dried lotus pods in a natural brown tone that last season after season. Vase not included.',id,'botanical-boho',799,null,15,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,false,40,now() - interval '11 days'
from public.categories where slug = 'vases-planters';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A25445','geometric-mirror-base-table-lamp','Geometric Mirror-Base Table Lamp','A faceted metal and mirror base with a drum shade that throws a warm, glowing light.',id,'modern-living',4299,3599,16,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,true,false,43,now() - interval '12 days'
from public.categories where slug = 'lighting';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A27334','starcut-tealight-holders-set-of-2','Star-cut Tealight Holders, Set of 2','Two patterned holders with star cut-outs that scatter warm light across a table.',id,'festive-glow',899,699,17,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,true,46,now() - interval '13 days'
from public.categories where slug = 'tabletop';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A29223','petal-edge-ceramic-dinner-plate-set','Petal-Edge Ceramic Dinner Plate Set','Glazed dinner plates with a ruffled petal edge in rich wine and gold tones.',id,'botanical-boho',3499,2999,18,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,false,49,now() - interval '14 days'
from public.categories where slug = 'tabletop';
insert into public.products (sku,slug,name,description,category_id,collection,price,sale_price,stock,materials,dimensions,colors,specs,is_featured,is_bestseller,sold_count,created_at)
select 'AUR-A2B112','silver-peacock-lidded-bowls-with-tray','Silver Peacock Lidded Bowls with Tray','Two lidded bowls with peacock finials on a matching oval tray, made for festive serving.',id,'festive-glow',3999,3299,19,null,null,'{}'::text[],'{"Origin": "Handcrafted in India"}'::jsonb,false,false,52,now() - interval '15 days'
from public.categories where slug = 'tabletop';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/twin-swan-brass-showpiece-1.jpg','Twin Swan Brass Showpiece',1 from public.products where slug='twin-swan-brass-showpiece';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/jewelled-elephant-figurine-1.jpg','Jewelled Elephant Figurine',1 from public.products where slug='jewelled-elephant-figurine';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/serene-buddha-bust-1.jpg','Serene Buddha Bust with Wooden Base',1 from public.products where slug='serene-buddha-bust';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/tall-ship-wooden-model-1.jpg','Tall Ship Wooden Model',1 from public.products where slug='tall-ship-wooden-model';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/golden-ginkgo-leaf-sculpture-1.jpg','Golden Ginkgo Leaf Sculpture',1 from public.products where slug='golden-ginkgo-leaf-sculpture';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/floral-medallion-metal-wall-art-1.jpg','Floral Medallion Metal Wall Art',1 from public.products where slug='floral-medallion-metal-wall-art';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/gilded-leaf-wall-clock-1.jpg','Gilded Leaf Wall Clock — photo 1',1 from public.products where slug='gilded-leaf-wall-clock';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/gilded-leaf-wall-clock-2.jpg','Gilded Leaf Wall Clock — photo 2',2 from public.products where slug='gilded-leaf-wall-clock';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/noir-gloss-vase-with-white-blooms-1.jpg','Noir Gloss Vase with White Blooms',1 from public.products where slug='noir-gloss-vase-with-white-blooms';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/pampas-duo-ceramic-vase-set-1.jpg','Pampas Duo Ceramic Vase Set',1 from public.products where slug='pampas-duo-ceramic-vase-set';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/ribbed-terracotta-bud-vase-1.jpg','Ribbed Terracotta Bud Vase',1 from public.products where slug='ribbed-terracotta-bud-vase';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/amber-glass-pendant-light-1.jpg','Amber Glass Pendant Light',1 from public.products where slug='amber-glass-pendant-light';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/gilded-lion-statue-1.jpg','Gilded Lion Statue',1 from public.products where slug='gilded-lion-statue';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/gold-branch-marble-base-sculpture-1.jpg','Gold Branch Sculpture on Marble Base',1 from public.products where slug='gold-branch-marble-base-sculpture';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/tree-of-life-brass-ring-on-wooden-base-1.jpg','Tree of Life Ring on Wooden Base',1 from public.products where slug='tree-of-life-brass-ring-on-wooden-base';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/handpainted-floral-wreath-showpiece-1.jpg','Hand-painted Floral Wreath Showpiece',1 from public.products where slug='handpainted-floral-wreath-showpiece';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/stag-pair-showpiece-1.jpg','Stag Pair Showpiece',1 from public.products where slug='stag-pair-showpiece';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/contemplation-figurine-trio-1.jpg','Contemplation Figurine Trio',1 from public.products where slug='contemplation-figurine-trio';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/embrace-abstract-couple-sculpture-1.jpg','Embrace Abstract Couple Sculpture',1 from public.products where slug='embrace-abstract-couple-sculpture';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/standing-figure-blue-orb-sculpture-1.jpg','Standing Figure with Blue Orb Sculpture',1 from public.products where slug='standing-figure-blue-orb-sculpture';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/climbing-elephant-family-shelf-sitters-1.jpg','Climbing Elephant Family Shelf Sitters',1 from public.products where slug='climbing-elephant-family-shelf-sitters';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/sleek-ceramic-vase-trio-1.jpg','Sleek Ceramic Vase Trio',1 from public.products where slug='sleek-ceramic-vase-trio';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/dried-lotus-pod-stems-1.jpg','Dried Lotus Pod Stems',1 from public.products where slug='dried-lotus-pod-stems';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/geometric-mirror-base-table-lamp-1.jpg','Geometric Mirror-Base Table Lamp',1 from public.products where slug='geometric-mirror-base-table-lamp';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/starcut-tealight-holders-set-of-2-1.jpg','Star-cut Tealight Holders, Set of 2',1 from public.products where slug='starcut-tealight-holders-set-of-2';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/petal-edge-ceramic-dinner-plate-set-1.jpg','Petal-Edge Ceramic Dinner Plate Set',1 from public.products where slug='petal-edge-ceramic-dinner-plate-set';
insert into public.product_images (product_id,url,alt,sort_order) select id,'/assets/products/silver-peacock-lidded-bowls-with-tray-1.jpg','Silver Peacock Lidded Bowls with Tray',1 from public.products where slug='silver-peacock-lidded-bowls-with-tray';

insert into public.coupons (code, discount_type, discount_value, min_subtotal, max_uses, expires_at) values
 ('WELCOME10','percent',10,2000,null,null),
 ('AURELLE500','fixed',500,5000,500, now() + interval '1 year')
on conflict (code) do nothing;

insert into public.store_settings (key, value) values
 ('store', '{"name":"AURELLE","tagline":"Living, Refined.","currency":"INR","currency_symbol":"₹"}'),
 ('announcement', '{"text":"Complimentary shipping on orders above ₹5,000 · Use WELCOME10 for 10% off your first order","enabled":true}'),
 ('contact', '{"email":"hello@aurelle.example","phone":"+91 00000 00000","address":"Studio address, City, State, India"}'),
 ('shipping', '{"flat_rate":199,"free_threshold":5000,"info":"Orders ship within 2–4 business days. Delivery takes 3–7 business days across India."}')
on conflict (key) do nothing;
