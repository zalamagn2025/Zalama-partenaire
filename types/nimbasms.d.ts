declare module "nimbasms" {
  export interface NimbaSMSConfig {
    SERVICE_ID: string;
    SECRET_TOKEN: string;
  }

  export interface MessageBody {
    to: string[];
    message: string;
    sender_name: string;
  }

  export interface Client {
    messages: {
      create(body: MessageBody): Promise<any>;
      list(options?: { limit?: number }): Promise<any>;
      get(messageId: string): Promise<any>;
    };
    accounts: {
      get(): Promise<any>;
    };
    groups: {
      list(): Promise<any>;
    };
    sendernames: {
      list(): Promise<any>;
    };
    contacts: {
      list(): Promise<any>;
      create(body: any): Promise<any>;
    };
    verifications: {
      create(verification: any): Promise<any>;
      verify(params: any): Promise<any>;
    };
  }

  export function Client(config: NimbaSMSConfig): Client;
}
