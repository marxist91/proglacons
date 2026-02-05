import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ccadqeofdswckvznzjjr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_EZrqyhxxKNYG1tI5R3JrVg_4RXwjdTY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  profiles: {
    async getAll() {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async get(id: string) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    }
  },
  products: {
    async getAll() {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data;
    },
    async create(product: any) {
      const { data, error } = await supabase.from('products').insert([product]).select();
      if (error) throw error;
      return data[0];
    },
    async update(id: string, updates: any) {
      const { data, error } = await supabase.from('products').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    async delete(id: string) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    async uploadImage(file: File) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    }
  },
  orders: {
    async getAll() {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(order: any) {
      const { data, error } = await supabase.from('orders').insert([order]).select();
      if (error) throw error;
      return data[0];
    },
    async updateStatus(id: string, status: string, driverId?: string) {
      const updates: any = { status };
      if (driverId) updates.driver_id = driverId;
      const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    }
  },
  drivers: {
    async getAll() {
      const { data, error } = await supabase.from('drivers').select('*');
      if (error) throw error;
      return data;
    },
    async create(driver: any) {
      const { data, error } = await supabase.from('drivers').insert([driver]).select();
      if (error) throw error;
      return data[0];
    }
  },
  
  // ========================================
  // SYSTÈME DE FIDÉLITÉ
  // ========================================
  loyalty: {
    // Récupérer les points d'un utilisateur
    async getPoints(userId: string) {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Pas encore de compte fidélité, le créer
        return this.createAccount(userId);
      }
      if (error) throw error;
      return data;
    },
    
    // Créer un compte fidélité
    async createAccount(userId: string) {
      const { data, error } = await supabase
        .from('loyalty_points')
        .insert([{
          user_id: userId,
          points: 50, // Bonus de bienvenue
          total_earned: 50,
          total_spent: 0,
          tier: 'bronze'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Enregistrer la transaction de bienvenue
      await this.addTransaction(userId, 50, 'bonus', 'Bonus de bienvenue');
      
      return data;
    },
    
    // Ajouter des points après une commande
    async addPointsFromOrder(userId: string, orderId: string, orderTotal: number) {
      // Calculer les points (10 points par 1000 FCFA)
      const basePoints = Math.floor(orderTotal / 1000) * 10;
      
      // Récupérer le compte pour appliquer le multiplicateur de niveau
      const account = await this.getPoints(userId);
      const tierMultiplier = this.getTierMultiplier(account.tier);
      const earnedPoints = Math.floor(basePoints * tierMultiplier);
      
      if (earnedPoints <= 0) return account;
      
      // Mettre à jour les points
      const newTotal = account.points + earnedPoints;
      const newTotalEarned = account.total_earned + earnedPoints;
      const newTier = this.calculateTier(newTotalEarned);
      
      const { data, error } = await supabase
        .from('loyalty_points')
        .update({
          points: newTotal,
          total_earned: newTotalEarned,
          tier: newTier,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Enregistrer la transaction
      await this.addTransaction(
        userId, 
        earnedPoints, 
        'earn', 
        `Commande #${orderId.substring(0, 8)}`,
        orderId
      );
      
      return data;
    },
    
    // Utiliser des points pour une réduction
    async redeemPoints(userId: string, pointsToRedeem: number, discountValue: number) {
      const account = await this.getPoints(userId);
      
      if (account.points < pointsToRedeem) {
        throw new Error('Points insuffisants');
      }
      
      const { data, error } = await supabase
        .from('loyalty_points')
        .update({
          points: account.points - pointsToRedeem,
          total_spent: account.total_spent + pointsToRedeem,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Enregistrer la transaction
      await this.addTransaction(
        userId,
        -pointsToRedeem,
        'redeem',
        `Réduction de ${discountValue.toLocaleString()} FCFA`
      );
      
      return data;
    },
    
    // Ajouter une transaction
    async addTransaction(
      userId: string, 
      points: number, 
      type: 'earn' | 'redeem' | 'bonus' | 'expire',
      description: string,
      orderId?: string
    ) {
      const { error } = await supabase
        .from('loyalty_transactions')
        .insert([{
          user_id: userId,
          order_id: orderId,
          points,
          type,
          description
        }]);
      
      if (error) console.error('Error adding loyalty transaction:', error);
    },
    
    // Récupérer l'historique des transactions
    async getTransactions(userId: string, limit = 20) {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    
    // Calculer le niveau en fonction des points totaux gagnés
    calculateTier(totalEarned: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
      if (totalEarned >= 5000) return 'platinum';
      if (totalEarned >= 1500) return 'gold';
      if (totalEarned >= 500) return 'silver';
      return 'bronze';
    },
    
    // Obtenir le multiplicateur de niveau
    getTierMultiplier(tier: string): number {
      const multipliers: Record<string, number> = {
        bronze: 1,
        silver: 1.25,
        gold: 1.5,
        platinum: 2
      };
      return multipliers[tier] || 1;
    }
  }
};

// ========================================
// HELPER FUNCTIONS FOR ADMIN DASHBOARD
// ========================================
export async function updateOrderStatus(orderId: string, status: string, driverId?: string) {
  return db.orders.updateStatus(orderId, status, driverId);
}

export async function updateProfile(id: string, updates: any) {
  return db.profiles.update(id, updates);
}

export async function addDriver(driver: any) {
  return db.drivers.create(driver);
}

export async function updateProduct(id: string, updates: any) {
  return db.products.update(id, updates);
}

export async function addProduct(product: any) {
  return db.products.create(product);
}

export async function deleteProduct(id: string) {
  return db.products.delete(id);
}
