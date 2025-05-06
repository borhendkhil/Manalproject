
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/machine';

export const getMachineData = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getEtat = async () => {
  const res = await axios.get(`${API_URL}/etat`);
  return res.data;
};

export const setEtat = async (etat) => {
  const res = await axios.post(`${API_URL}/etat`, { etat });
  return res.data;
};
