const axios = require('axios');

class MPesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    
    this.baseURL = this.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';
  }

  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(
        `${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw new Error('Failed to get MPesa access token');
    }
  }

  generatePassword() {
    const timestamp = this.getTimestamp();
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    return { password, timestamp };
  }

  getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  formatPhoneNumber(phone) {
    // Convert phone to 254XXXXXXXXX format
    let formatted = phone.replace(/\s/g, '');
    
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (formatted.startsWith('+254')) {
      formatted = formatted.substring(1);
    } else if (!formatted.startsWith('254')) {
      formatted = '254' + formatted;
    }
    
    return formatted;
  }

  async initiateSTKPush(phone, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();
      const formattedPhone = this.formatPhoneNumber(phone);

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(amount), // Must be integer
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('STK Push Error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.errorMessage || 'Payment initiation failed',
        error: error.response?.data
      };
    }
  }

  async queryTransaction(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.generatePassword();

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Query Transaction Error:', error.response?.data || error.message);
      return {
        success: false,
        message: 'Failed to query transaction',
        error: error.response?.data
      };
    }
  }
}

module.exports = new MPesaService();