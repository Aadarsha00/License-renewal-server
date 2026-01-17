import axios from "axios";

export const verifyKhaltiPayment = async (token: string, amount: number) => {
  try {
    const response = await axios.post(
      "https://khalti.com/api/v2/payment/verify/",
      {
        token: token,
        amount: amount, // amount in paisa (1 rupee = 100 paisa)
      },
      {
        headers: {
  Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
  'Content-Type': 'application/json',
},
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Payment verification failed");
  }
};