import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { storage } from './storage';

const RESET_TOKEN_EXPIRY_MINUTES = 30;

export const passwordResetService = {
  /**
   * Generate password reset token
   */
  async generateResetToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    
    await storage.createPasswordResetToken({
      userId,
      token,
      expiresAt,
    });
    
    return token;
  },

  /**
   * Verify reset token is valid and not expired
   */
  async verifyResetToken(token: string): Promise<{ userId: string } | null> {
    const resetToken = await storage.getPasswordResetToken(token);
    
    if (!resetToken) {
      return null;
    }
    
    const now = new Date();
    if (now > resetToken.expiresAt) {
      await storage.deletePasswordResetToken(token);
      return null;
    }
    
    return { userId: resetToken.userId };
  },

  /**
   * Reset password with valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const resetToken = await storage.getPasswordResetToken(token);
    
    if (!resetToken) {
      return false;
    }
    
    const now = new Date();
    if (now > resetToken.expiresAt) {
      await storage.deletePasswordResetToken(token);
      return false;
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await storage.updateUser(resetToken.userId, {
      password: hashedPassword,
    });
    
    // Delete reset token
    await storage.deletePasswordResetToken(token);
    
    return true;
  },

  /**
   * Generate reset link for email
   */
  generateResetLink(token: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    return `${baseUrl}/reset-password/${token}`;
  },
};
