export interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  userName?: string;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    this.fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
    this.fromName = "Partner";
  }

  /**
   * Envoie un email OTP
   */
  async sendOTPEmail(
    to: string,
    otp: string,
    userName?: string
  ): Promise<boolean> {
    try {
      // Pour les tests, utiliser l'email vérifié de l'utilisateur
      const testEmail = process.env.TEST_EMAIL || "zalamagn@gmail.com";
      const actualTo = process.env.NODE_ENV === "development" ? testEmail : to;

      const emailData: EmailData = {
        to: actualTo,
        subject: "Code de vérification - Partner",
        html: this.getOTPEmailTemplate(otp, userName),
        text: this.getOTPEmailText(otp, userName),
        userName,
      };

      console.log(`📧 Envoi email OTP à: ${actualTo} (original: ${to})`);
      return await this.sendEmail(emailData);
    } catch (error) {
      console.error("Erreur envoi email OTP:", error);
      return false;
    }
  }

  /**
   * Template HTML pour l'email OTP
   */
  private getOTPEmailTemplate(otp: string, userName?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0; font-size: 24px;">Partner</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Code de vérification</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 8px; font-family: monospace;">${otp}</h2>
          </div>
          
          <div style="margin: 20px 0;">
            <p style="color: #333; line-height: 1.6;">
              ${userName ? `Bonjour ${userName},` : "Bonjour,"}
            </p>
            <p style="color: #333; line-height: 1.6;">
              Vous avez demandé un code de vérification pour accéder à votre compte Partner.
            </p>
            <p style="color: #333; line-height: 1.6;">
              <strong>Code de vérification : ${otp}</strong>
            </p>
            <p style="color: #666; font-size: 14px;">
              Ce code est valide pendant 2 minutes. Ne le partagez avec personne.
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Si vous n'avez pas demandé ce code, ignorez cet email.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Template texte pour l'email OTP
   */
  private getOTPEmailText(otp: string, userName?: string): string {
    return `
Code de vérification - Partner

${userName ? `Bonjour ${userName},` : "Bonjour,"}

Vous avez demandé un code de vérification pour accéder à votre compte Partner.

Code de vérification : ${otp}

Ce code est valide pendant 2 minutes. Ne le partagez avec personne.

Si vous n'avez pas demandé ce code, ignorez cet email.

--
Partner
    `;
  }

  /**
   * Méthode générique d'envoi d'email avec Resend
   */
  private async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error(
          "Clé API Resend manquante. Veuillez configurer RESEND_API_KEY"
        );
        return false;
      }

      const { Resend } = await import("resend");
      const resend = new Resend(this.apiKey);

      const { data, error } = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html || "<p>Email de Partner</p>",
        text: emailData.text || "Email de Partner",
      });

      if (error) {
        console.error("Erreur Resend:", error);
        return false;
      }

      console.log("Email envoyé avec succès via Resend:", data);
      return true;
    } catch (error) {
      console.error("Erreur envoi email:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
