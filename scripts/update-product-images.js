// Script pour mettre à jour les images des produits dans Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ccadqeofdswckvznzjjr.supabase.co';
const supabaseKey = 'sb_publishable_EZrqyhxxKNYG1tI5R3JrVg_4RXwjdTY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping des images locales
const imageMap = {
  'Cubes de Luxe': '/images/IMG_0554.jpg',
  'Grains de Luxe': '/images/IMG_0555.jpg',
  'Glaçons Classiques': '/images/IMG_0556.jpg',
  'Ice Cup Cubes': '/images/IMG_0557.jpg',
  'Ice Cup Grains': '/images/IMG_0554.jpg',
  'Ice Cup': '/images/IMG_0557.jpg',
  'ice cup': '/images/IMG_0557.jpg',
  'Carbo Glace (Carton)': '/images/IMG_0555.jpg',
  'Carbo Glace (Sachet)': '/images/IMG_0556.jpg',
  'Pack Événement': '/images/IMG_0557.jpg',
};

async function updateProductImages() {
  console.log('Récupération des produits...');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) {
    console.error('Erreur:', error);
    return;
  }
  
  console.log(`${products.length} produits trouvés`);
  
  for (const product of products) {
    console.log(`Produit: ${product.name}`);
    console.log(`  Image actuelle: ${product.imageUrl}`);
    
    // Trouver l'image correspondante
    let newImageUrl = '/images/IMG_0554.jpg'; // Default
    
    for (const [namePart, imageUrl] of Object.entries(imageMap)) {
      if (product.name && product.name.toLowerCase().includes(namePart.toLowerCase())) {
        newImageUrl = imageUrl;
        break;
      }
    }
    
    // Mettre à jour si l'image n'est pas déjà une image locale
    if (!product.imageUrl || !product.imageUrl.startsWith('/images/')) {
      console.log(`  Mise à jour vers: ${newImageUrl}`);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ imageUrl: newImageUrl })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`  Erreur:`, updateError);
      } else {
        console.log(`  ✓ Mis à jour`);
      }
    } else {
      console.log(`  Déjà locale, skipped`);
    }
  }
  
  console.log('Terminé!');
}

updateProductImages();
