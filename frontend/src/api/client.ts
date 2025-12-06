import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const client = axios.create({
  baseURL: API_URL,
});

export interface CreateMessageResponse {
    public_id: string;
    private_key: string;
}

export interface GetMessageResponse {
    msg: string;
}

export const createMessage = async (msg: string, expiration: number, password?: string): Promise<CreateMessageResponse> => {
  const response = await client.post('/message', { msg, expiration, password });
  return response.data;
};

export const getMessage = async (publicId: string, privateKey: string): Promise<GetMessageResponse> => {
  const response = await client.post('/message/fetch', { public_id: publicId, private_key: privateKey });
  return response.data;
};
