declare module 'textlk-node' {
  export interface SMSParams {
    phoneNumber: string;
    message: string;
    apiToken?: string;
    senderId?: string;
  }

  export interface SMSResponse {
    status: 'success' | 'error';
    message?: string;
    error?: string;
    data?: {
      uid: string;
      to: string;
      from: string;
      message: string;
      status: string;
      cost: string;
      sms_count: number;
    };
    [key: string]: any;
  }

  export function sendSMS(params: SMSParams): Promise<SMSResponse>;
}
