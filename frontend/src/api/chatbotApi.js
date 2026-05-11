import axios from "axios";

export const sendMessage = async (message) => {

  const response = await axios.post(
    "http://127.0.0.1:8000/api/chatbot/",
    { message }
  );

  return response.data;
};