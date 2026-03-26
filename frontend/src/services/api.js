import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.detail || error.response.statusText;
      throw new Error(`API Error (${error.response.status}): ${message}`);
    } else if (error.request) {
      throw new Error('Network Error: Unable to reach the server. Please check your connection.');
    } else {
      throw new Error(`Request Error: ${error.message}`);
    }
  }
);

const retryRequest = async (requestFn, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

export const apiService = {
  async getScenes() {
    return retryRequest(async () => {
      const response = await api.get('/api/scenes');
      return response.data;
    });
  },

  async getFrames(sceneId) {
    return retryRequest(async () => {
      const response = await api.get(`/api/scenes/${sceneId}/frames`);
      return response.data;
    });
  },

  async getFrameDetail(frameId) {
    return retryRequest(async () => {
      const response = await api.get(`/api/frames/${frameId}`);
      return response.data;
    });
  },

  async getSensorData(frameId, sensorType) {
    return retryRequest(async () => {
      const response = await api.get(`/api/frames/${frameId}/sensor/${sensorType}`);
      return response.data;
    });
  },

  async getQualityReport(frameId) {
    return retryRequest(async () => {
      const response = await api.get(`/api/frames/${frameId}/quality`);
      return response.data;
    });
  },

  getSensorImageUrl(dataUrl) {
    if (dataUrl && dataUrl.startsWith('/api/files/')) {
      return `${API_BASE_URL}${dataUrl}`;
    }
    return dataUrl;
  },
};

export default apiService;
